module.exports = {

  secondsToString: function(s) {
    var numdays = Math.floor((s % 31536000) / 86400);
    var numhours = Math.floor(((s % 31536000) % 86400) / 3600);
    var numminutes = Math.floor((((s % 31536000) % 86400) % 3600) / 60);
    return numdays + 'days ' + numhours + 'hours ' + numminutes + 'minutes';
  }

};
