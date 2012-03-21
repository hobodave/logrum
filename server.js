
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , util = require('util')
  , fs = require('fs')
  , url = require('url')
  , io = require('socket.io')
  , yaml = require('js-yaml')
  , glob = require('glob')
  , child = require('child_process');

var app = module.exports = express.createServer();
var io = io.listen(app);

var parseConfig = function(filename) {
  return yaml.load(fs.readFileSync(filename, 'utf8'));
};

var config = parseConfig('./config/config.yml');

var logs = [];

for (var i=0; i < config.logs.length; i++) {
  files = glob.sync(config.logs[i]);

  for (var j=0; j < files.length; j++) {
    if (-1 == logs.indexOf(files[j])) {
      logs.push(files[j]);
    }
  };
};

var log_opts = [];

for (var i=0; i < logs.length; i++) {
  log_opts.push({idx: i, name: logs[i]});
};

// Configuration

app.helpers({
  log_opts: log_opts,
  config: config
});

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {layout: false});
  app.use(express.basicAuth(config.user, config.pass));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});


io.configure('production', function() {
  io.enable('browser client minification');  // send minified client
  io.enable('browser client etag');          // apply etag caching logic based on version number
  io.enable('browser client gzip');          // gzip the file
  io.set('log level', 1);                    // reduce logging
  io.set('transports', [                     // enable all transports (optional if you want flashsocket)
      'websocket'
    , 'flashsocket'
    , 'htmlfile'
    , 'xhr-polling'
    , 'jsonp-polling'
  ]);
});

// Routes

app.get('/', routes.index);

app.listen(config.port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

var processes = {};

io.sockets.on('connection', function(client) {

  var sessionId = client.sessionId;
  var stringdata = '';
  var restdata = '';

  processes[sessionId] = {
    active_log: null,
    active_search: null,
    tail: null,
    grep: null
  }

  var emit_data = function(data, search) {
    stringdata = restdata + data;
    linedata = stringdata.substr(0, stringdata.lastIndexOf('\n')).split('\n');
    restdata = stringdata.substr(stringdata.lastIndexOf('\n') + 1);

    buffer = []
    for (var i=0; i < linedata.length; i++) {
      if (search && !linedata[i].match(search)) {
        continue;
      }
      buffer.push({ message: linedata[i] });
    };

    if (buffer.length > 0) {
      client.emit('buffer', { buffer: buffer });
    }

    buffer = []
  };

  var tail_start = function(active, search) {
    var tail_opts = ["-f", "-n", 250, logs[active]];

    processes[sessionId].active_log = active;
    processes[sessionId].active_search = search;
    processes[sessionId].tail = child.spawn("tail", tail_opts);
    processes[sessionId].tail.stdout.on("data", function(data) {
        emit_data(data, search);
    });
  }

  var tail_stop = function() {
    if (processes[sessionId].tail !== null) processes[sessionId].tail.kill();
  }

  client.on('log_request', function(message) {
    var active = parseInt(message.log_file);
    var search = message.search;
    if (active !== processes[sessionId].active_log || search !== processes[sessionId].active_search) {
      tail_stop();
      client.emit('flush');
      tail_start(active, search);
    }
  });

  client.on('disconnect', function(){
    tail_stop();
  });
});
