var os = require('os');

var v4 = '(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])(?:\\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])){3}';
var v6 = '(?:(?:[0-9a-fA-F:]){1,4}(?:(?::(?:[0-9a-fA-F]){1,4}|:)){2,7})+';

module.exports = {

  isIPv4: function(str) {
    return new RegExp('^' + v4 + '$').test(str);
  },

  isIPv6: function(str) {
    return new RegExp('^' + v6 + '$').test(str);
  },

  getIPv4Internal: function() {
    var retv4 = '127.0.0.1';
    var interfaces = os.networkInterfaces();

    Object.keys(interfaces).forEach(function(el) {
      interfaces[el].forEach(function(el2) {
        if (!el2.internal && el2.family === 'IPv4') {
          retv4 = el2.address;
        }
      });
    });

    return retv4;
  },

  getIPv6Internal: function() {
    var retv6 = '::1';
    var interfaces = os.networkInterfaces();

    Object.keys(interfaces).forEach(function(el) {
      interfaces[el].forEach(function(el2) {
        if (!el2.internal && el2.family === 'IPv6') {
          retv6 = el2.address;
        }
      });
    });

    return retv6;
  },

  getMAC: function() {
    var retMac = '00:00:00:00:00:00';
    var interfaces = os.networkInterfaces();

    Object.keys(interfaces).forEach(function(el) {
      interfaces[el].forEach(function(el2) {
        if (!el2.internal && el2.family === 'IPv4') {
          retMac = el2.mac;
        }
      });
    });

    return retMac;
  }

};
