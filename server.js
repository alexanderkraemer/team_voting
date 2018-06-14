var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');

http.listen(3000, "127.0.0.1", function() {
   console.log('listening on localhost:3000');
});

app.get('/', function(req, res) {
   res.sendFile( __dirname + '/public/' + 'index.html' );
});
app.get('/css', function(req, res) {
   res.sendFile( __dirname + '/public/css/style.css');
});
app.get('/js', function(req, res) {
   res.sendFile( __dirname + '/public/js/scripts.js');
});

app.get('/admin', function(req, res) {
   res.sendFile( __dirname + '/public/admin.html');
});
app.get('/teams', function(req, res) {
   res.sendFile( __dirname + '/public/teams.html');
});
app.get('/stats', function(req, res) {
   res.sendFile( __dirname + '/public/stats.html');
});




var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "voting"
});

function insertTeam(teamname, callback) {
  var sql = "INSERT INTO teams (name) VALUES (" + con.escape(teamname) + ")";
  con.query(sql, function (err, result) {
    if (err) {
      console.log(err);
    }
    callback(result);
  });
}

function insertVote(user_id, team_id, points) {
  var sql = "INSERT INTO votes (user_id, team_id, points) " +
  "VALUES (" + user_id + ", " + team_id + ", " + points + ")";
  con.query(sql, function (err, result) {
    if (err) {
      console.log(err);
    }
    console.log('sql', sql);
    console.log("1 record inserted");
  });
}

function insertUser(username) {
  var sql = "INSERT INTO users (name) VALUES (" + con.escape(username) + ")";
  con.query(sql, function (err, result) {
    if (err) {
      console.log(err);
    }
  });
}

function findUser(username, callback) {
  sql = 'SELECT * FROM users where name = ' + con.escape(username);
  con.query(sql, function (error, results, fields) {
    if (error) {
      console.log(error);
    }
    callback(results);
  });
}

function findVotesByUser(user_id, callback) {
  sql = "SELECT * FROM votes where user_id = " + con.escape(user_id);
  con.query(sql, function (error, results, fields) {
    if (error) {
      console.log(error);
    }
    callback(results);
  });
}

function getVotesByTeam(team_id, callback) {
  sql = "SELECT * FROM votes where team_id = " + con.escape(team_id);
  con.query(sql, function (error, results, fields) {
    if (error) {
      console.log(error);
    }
    callback(results);
  });
}

function getTeams(callback) {
  sql = 'SELECT * FROM teams';
  con.query(sql, function (error, results, fields) {
    if (error) {
      console.log(error);
    }
    callback(results);
  });
}

function findTeam(teamname, callback) {
  sql = 'SELECT * FROM teams where name = ' + con.escape(teamname);
  con.query(sql, function (error, results, fields) {
    if (error) {
      console.log(error);
    }
    callback(results);
  });
}

function deleteTeam(team_id, callback) {
  sql = 'DELETE FROM teams where id = ' + con.escape(team_id);
  con.query(sql, function (error, results, fields) {
    if (error) {
      console.log(error);
    }
    callback(results);
  });
}

function updateTeamVotesOnAllClients(team, socket) {
  getVotesByTeam(team.id, function(votes) {
    sum = 0;
    votes.forEach(function(vote) {
      sum += vote.points
    });
    team.points = sum;
    socket.broadcast.emit('team.update', team);
    socket.emit('team.update', team);
  });
}

function updateTeamVotesOnOwnClient(team, socket) {
  getVotesByTeam(team.id, function(votes) {
    sum = 0;
    votes.forEach(function(vote) {
      sum += vote.points
    });
    team.points = sum;
    socket.emit('team.update', team);
  });
}

io.on('connection', function(socket) {
  console.log('A client connected');

  socket.on('user.register', function(data) {
    findUser(data.name, function(results) {
      if(results.length > 0) {
        console.log('User: "' + data.name + '" already registered');
      } else {
        insertUser(data.name);
        console.log('User: "' + data.name + '" newly registered');
      }
    });

    getTeams(function(results) {
      socket.emit('teams.all', results);
    })
  });

  socket.on('team.fetch', function(data) {
    getTeams(function(teams) {
      teams.forEach(function(team) {
        updateTeamVotesOnOwnClient(team, socket);
      });
    });
  });

  socket.on('team.new', function(team) {
    insertTeam(team.name, function(result) {
      getTeams(function(teams) {
        teams.forEach(function(team) {
          console.log(team);
          updateTeamVotesOnAllClients(team, socket);
        });
      });
    })
  })

  socket.on('team.delete', function(team){
    deleteTeam(team.id, function(results) {
      socket.broadcast.emit('team.deleted', team );
      socket.emit('team.deleted', team );
    })
  })

  socket.on('user.can_vote', function(data) {
    findUser(data.name, function(user) {
	console.log('user: ', user);
      findVotesByUser(user.id, function (result) {
	console.log(result);
        if(result.length > 0) {
          socket.emit('user.can_vote.no');
        } else {
          socket.emit('user.can_vote.yes');
        }
      });
    });
  });

  socket.on('user.available', function(data) {
    findUser(data.name, function(user) {
      console.log(user);
      if(user.length > 0) {
        socket.emit('user.available.no');
      } else {
        socket.emit('user.available.yes');
      }
    });
  });

  socket.on('user.vote', function(data) {
    username = data.username;
    teamname = data.teamname;
    points = data.points;
    findUser(username, function(data) {
      user = data[0];
      findTeam(teamname, function(data){
        team = data[0];
        insertVote(user.id, team.id, points);
      });
    });

    getTeams(function(teams) {
      teams.forEach(function(team) {
        updateTeamVotesOnAllClients(team, socket);
      });
    });
  });
});
