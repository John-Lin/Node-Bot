var irc = require('irc');
var util = require('util');
var os = require('os');
var dns = require('dns');

var iputils = require('ip');
var randomstring = require('randomstring');
var portscanner = require('portscanner');
var wget = require('wget-improved');

var netUtils = require('./lib/net-utils');
var formatUtils = require('./lib/format-utils');
var config = require('./config');

var VERSION = '0.0.1'

var listenMode = false
var nickName = config.nickname || 'nbot_' + randomstring.generate(4);

var bot = new irc.Client('irc.freenode.net', nickName, {
  debug: true,
  channels: config.channels
});

bot.addListener('error', function(message) {
  console.error('[x] ERROR: %s: %s', message.command, message.args.join(' '));
});

bot.addListener('message#hsnl.bots', function(from, message) {
  console.log(from + ' => #hsnl.bots: ' + message);

  if (message.match(/^\:set listen$/)) {
    listenMode = true;
    bot.say('#hsnl.bots', '<Bot in listen mode>');
  } else if (message.match(/^\:set nolisten$/)) {
    listenMode = false;
    bot.say('#hsnl.bots', '<Bot quit listen mode>');
  }

  if (message.match(/^\!hello$/) && listenMode) {
    bot.say('#hsnl.bots', 'Hello there ' + from);

  } else if (message.match(/^\!sysinfo$/) && listenMode) {
    var totalMem = os.totalmem() / (2 << 19);
    var freeMem =  os.freemem() / (2 << 19);
    var upTime =  formatUtils.secondsToString(os.uptime());
    var cpuInfo = os.cpus()[0].model;
    var osTypeArch = os.type() + ' ' + os.arch();

    var sysInfo = util.format('cpu: %s; ram: %sMB total, %sMB free; os: %s; uptime: %s.',
                              cpuInfo, totalMem, freeMem, osTypeArch, upTime);

    bot.say('#hsnl.bots', sysInfo);

  } else if (message.match(/^\!netinfo$/) && listenMode) {
    var upNetworkInterfaces = Object.keys(os.networkInterfaces()).toString();

    bot.say('#hsnl.bots', 'IP address: ' + iputils.address());

  } else if (message.match(/^\!scan (.*?) (.*?)$/)) {
    var matched = /^\!scan (.*?) (.*?)$/.exec(message);

    var port = matched[2];
    var ip =  matched[1];

    portscanner.checkPortStatus(port, ip, function(error, status) {
      if (error) {
        bot.say('#hsnl.bots', 'Invalid parameters.');
        return
      }

      bot.say('#hsnl.bots',
        ip + ':' + matched[2] + ' Port status: ' + status
      );
    });

  } else if (message.match(/^\!download (.*?) (.*?) (.*?)$/) && listenMode) {
    var matched = /^\!download (.*?) (.*?) (.*?)$/.exec(message);
    console.log(matched);

    var action = matched[3];
    var output =  matched[2] ;
    var url = matched[1];

    var download = wget.download(url, output);

    download.on('error', function(err) {
      console.log(err);
      bot.say('#hsnl.bots', err);
      return
    });

    download.on('end', function(output) {
      console.log(output);
      bot.say('#hsnl.bots', 'Save to ' + output);
    });
  } else if (message.match(/^\!about$/) && listenMode) {
    bot.say('#hsnl.bots',
      'nbot version ' + VERSION + ' by [John-Lin] (linton.tw@gmail.com).'
    );
  } else if (message.match(/^\!dns (.*?)$/) && listenMode) {
    var matched = /^\!dns (.*?)$/.exec(message);
    var host = matched[1];
    dns.lookup(host, function(err, ip, fam) {
      if (err) {
        bot.say('#hsnl.bots', 'Error message: ' + err);
        return
      }

      bot.say('#hsnl.bots', ip);
    });
  } else if (message.match(/^\!udp (.*?) (.*?) (.*?)$/) && listenMode) {
    var matched = /^\!udp (.*?) (.*?) (.*?)$/.exec(message);

    var pktSize = parseInt(matched[3], 10);
    var pktNum =  parseInt(matched[2], 10);
    var host = matched[1];

    if (isNaN(pktSize) || isNaN(pktNum) || !netUtils.isIPv4(host)) {
      bot.say('#hsnl.bots', 'Invalid parameters.');
      return
    }

    netUtils.sendUDP(host, pktNum, pktSize);

    bot.say('#hsnl.bots',
      'Sending ' + pktNum + ' udp packets to: ' + host + '. packet size: ' + pktSize + 'byte.'
    );
  }

});
