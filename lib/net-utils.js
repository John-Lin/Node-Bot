var os = require('os');
var dgram = require('dgram');

var v4 = '(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])(?:\\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])){3}';
var v6 = '(?:(?:[0-9a-fA-F:]){1,4}(?:(?::(?:[0-9a-fA-F]){1,4}|:)){2,7})+';

module.exports = {

  isIPv4: function(str) {
    return new RegExp('^' + v4 + '$').test(str);
  },

  isIPv6: function(str) {
    return new RegExp('^' + v6 + '$').test(str);
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
  },

  sendUDP: function(host, num, size) {
    // A normal payload cannot be larger than 64K octets.
    // internet header and data.
    // (65,507 bytes = 65,535 − 8 bytes UDP header − 20 bytes IP header)
    if (size > 1472) {
      size = 1472;
    }

    var buf = new Buffer(size);
    var port = Math.floor(Math.random() * (65535 - 1 + 1) + 1);
    var client = dgram.createSocket('udp4');

    for (var i = 0; i < num; i++) {
      if (i < num - 1) {
        client.send(buf, 0, buf.length, port, host);
      } else {
        client.send(buf, 0, buf.length, port, host, function(err) {
          // console.log('sent udp to ' + host + ':' + port + ' size: ' + buf.length);
          client.close();
        });
      }
    }
  }
};
