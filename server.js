var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');

http.listen(3000, function() {
   console.log('listening on localhost:3000');
});

app.get('/', function(req, res) {
   res.sendfile('public/index.html');
});
app.get('/css', function(req, res) {
   res.sendfile('public/css/style.css');
});
app.get('/js', function(req, res) {
   res.sendfile('public/js/scripts.js');
});
app.get('/admin', function(req, res) {
   res.sendfile('public/admin.html');
});
app.get('/teams', function(req, res) {
   res.sendfile('public/teams.html');
});
app.get('/stats', function(req, res) {
   res.sendfile('public/stats.html');
});




var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "voting"
});

function insertTeam(teamname) {
  var sql = "INSERT INTO teams (name) VALUES (" + con.escape(teamname) + ")";
  con.query(sql, function (err, result) {
    if (err) {
      console.log(err);
    }
    console.log("1 record inserted");
  });
}

function insertVote(user_id, team_id, points) {
  var sql = "INSERT INTO votes (user_id, team_id, points) " +
  "VALUES (" + user_id + ", " + team_id + ", " + points + ")";
  con.query(sql, function (err, result) {
    if (err) {
      console.log(err);
    }
    console.log("1 record inserted");
  });
}

function insertUser(username) {
  var sql = "INSERT INTO users (name) VALUES (" + con.escape(username) + ")";
  con.query(sql, function (err, result) {
    if (err) {
      console.log(err);
    }
    console.log("1 user inserted");
  });
}

function findUser(username, callback) {
  sql = 'SELECT * FROM users where name = ' + con.escape(username);
  con.query(sql, function (error, results, fields) {
    if (error) {
      console.log(error);
    }
    callback(results[0]);
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
    callback(results[0]);
  });
}

io.on('connection', function(socket) {
  console.log('A client connected');

  socket.on('user.register', function(data) {
    findUser(data.name, function(results) {
      if(results) {
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

  socket.on('teams.fetch', function(data) {
    getTeams(function(teams) {
      socket.emit('team.update', teams);
    });
  });

  socket.on('user.can_vote', function(data) {
    findUser(data.name, function(user) {
      findVotesByUser(user.id, function (result) {
        if(result.length > 0) {
          socket.emit('user.can_vote.no');
        } else {
          socket.emit('user.can_vote.yes');
        }
      });
    });
  });

  socket.on('user.vote', function(data) {
    username = data.username;
    teamname = data.teamname;
    points = data.points;
    findUser(username, function(user) {
      findTeam(teamname, function(team){
        insertVote(user.id, team.id, points);
      })

    });

    getTeams(function(teams) {
      socket.broadcast.emit('votes.update', teams);
    });
  });
});