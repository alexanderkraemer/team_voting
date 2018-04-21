$( document ).ready(function() {
  onStartup();
});

function getUsername() {
  if(getCookie('name') != "") {
    return getCookie('name');
  } else {
    window.location.replace("/");
  }
}

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
          c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
      }
  }
  return "";
}

function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  var expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function setName() {
  name = $('#name').val();
  setCookie('name', name, 1);

  if(getCookie('name') == "") {
    console.log('cookies not enabled!');
    showError('Cookies not enabled! Please enable your cookies in your browser settings!');
  } else {
    window.location.replace("/teams");
  }
}

function getUsername() {
  if(getCookie('name') == "") {
    window.location.replace("/");
  } else {
    return getCookie('name');
  }
}

function showError(message) {
  $('#error').text(message)
  $('#error').show();
}
