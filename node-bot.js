var irc = require('irc');
var util = require('util');
var os = require('os');

var randomstring = require('randomstring');
var portscanner = require('portscanner');
var wget = require('wget-improved');

var netUtils = require('./lib/net-utils');
var formatUtils = require('./lib/format-utils');
var config = require('./config');

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

  if (message.match(/hello/i) && listenMode) {
    bot.say('#hsnl.bots', 'Hello there ' + from);

  } else if (message.match(/^\!sysinfo$/) && listenMode) {
    var totalMem = os.totalmem() / (2 << 19);
    var freeMem =  os.freemem() / (2 << 19);
    var upTime =  formatUtils.secondsToString(os.uptime());
    var cpuInfo = os.cpus()[0].model + ' x' + os.cpus().length.toString() + ' Cores';
    var osTypeArch = os.type() + ' ' + os.arch();

    var sysInfo = util.format('cpu: %s; ram: %sMB total, %sMB free; os: %s; uptime: %s.',
                              cpuInfo, totalMem, freeMem, osTypeArch, upTime);

    bot.say('#hsnl.bots', sysInfo);

  } else if (message.match(/^\!netinfo$/) && listenMode) {
    var upNetworkInterfaces = Object.keys(os.networkInterfaces()).toString();
    var netInfo = util.format('MAC address: %s; IP address: %s', netUtils.getMAC(), netUtils.getIPv4Internal());

    // bot.say('#hsnl.bots', 'About Network interfaces info.: ' + upNetworkInterfaces);

    bot.say('#hsnl.bots', netInfo);

  } else if (message.match(/^\!scan (.*?) (.*?)$/)) {
    var matched = /^\!scan (.*?) (.*?)$/.exec(message);

    // bot.say('#hsnl.bots', 'scan <IP> <port>');
    // console.log(matched);
    var port = parseInt(matched[2]);
    var ip =  matched[1];

    if (netUtils.isIPv4(ip)) {
      if (port < 65536 && port >= 0) {
        portscanner.checkPortStatus(port, ip, function(error, status) {
          // console.log(status);
          bot.say('#hsnl.bots',  ip + ':' + matched[2] + ' Port status: ' + status);
        });
      } else { bot.say('#hsnl.bots', 'Invalid port number!'); }
    } else { bot.say('#hsnl.bots', 'Invalid IP address!'); }

  } else if (message.match(/^\!download (.*?) (.*?) (.*?)$/)) {
    var matched = /^\!download (.*?) (.*?) (.*?)$/.exec(message);
    console.log(matched);

    var action = parseInt(matched[3]);
    var output =  matched[2] ;
    var url = matched[1];

    var download = wget.download(url, output);

    download.on('error', function(err) {
      console.log(err);
      bot.say('#hsnl.bots', err);
    });

    download.on('end', function(output) {
      console.log(output);
      bot.say('#hsnl.bots', output);
    });
  }

});

function changeMode(msg) {
  if (msg.match(/^\:set listen$/)) {
    bot.say('#hsnl.bots', '<Bot in listen mode>');
    return true;
  } else if (msg.match(/^\:set nolisten$/)) {
    bot.say('#hsnl.bots', '<Bot quit listen mode>');
    return false;
  }

}
