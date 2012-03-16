var util = require('util')
  , fs = require('fs')
  , url = require('url')
  , http = require('http')
  , io = require('socket.io')
  , yaml = require('js-yaml')
  , glob = require('glob')
  , httpdigest = require('http-digest')
  , Mustache = require('mustache')
  , spawn = require('child_process').spawn;

var parseConfig = function(filename) {
  return yaml.load(fs.readFileSync(filename, 'utf8'));
}

var config = parseConfig('./config/config.yml')

var logs = []
for (var i=0; i < config.logs.length; i++) {
  files = glob.sync(config.logs[i]);
  for (var j=0; j < files.length; j++) {
    logs.push(files[j]);
  };
};

var log_opts = [];
for (var i=0; i < logs.length; i++) {
  log_opts.push({idx: i, name: logs[i]});
};

var actions = [];
actions.push({
  path: "/",
  template: "tail.html",
  view: {
    log_opts: log_opts,
    port: config.port
  }
})
var processes = {}

var server = httpdigest.createServer(config.user, config.pass, function(req, res) {

  req.addListener('end', function() {
    var action = actions.filter(function(a) { return req.url === a.path });
    action = (action.length > 0 ? action[0] : undefined);

    if ('undefined' == typeof action) {
      var path = url.parse(req.url).pathname;
      switch (path){
        case '/json.js':
          fs.readFile(__dirname + path, function(err, data){
            if (err) return send404(res);
            res.writeHead(200, {'Content-Type': 'text/javascript'})
            res.end(data, 'utf8');
          });
          break;
        default: send404(res);
      }
    } else {
      fs.readFile('./views/' + action.template, 'utf8', function(err, template) {
        if (err) {
          res.writeHead(500, {'Content-Type': 'text/plain'});
          res.end(''+err);
        } else {
          res.writeHead(200, {'Content-Type': 'text/html'})
          res.write(Mustache.to_html(template, action.view))
          res.end()
        }
      })
    }
  });
}),

send404 = function(res){
  res.writeHead(404, {'Content-Type': 'text/plain'});
  res.end('404 - Page Not Found');
};

server.listen(config.port);

var io = io.listen(server);

io.on('connection', function(client){

  var sessionId = client.sessionId;
  var stringdata = '';
  var restdata = '';

  processes[sessionId] = {
    active_log: null,
    tail: null
  }

  var tail_start = function(active) {
    processes[sessionId].active_log = active
    processes[sessionId].tail = spawn("tail", ["-f", "-n", 250, logs[active]])
    processes[sessionId].tail.stdout.setEncoding('utf8');
    processes[sessionId].tail.stdout.on("data", function (data) {
      stringdata = restdata + data;
      linedata = stringdata.substr(0, stringdata.lastIndexOf('\n')).split('\n');
      restdata = stringdata.substr(stringdata.lastIndexOf('\n') + 1);

      buffer = []
      for (var i=0; i < linedata.length; i++) {
        buffer.push({ message: linedata[i] });
      };
      client.send({ buffer: buffer });
      buffer = []
    })
  }

  var tail_stop = function() {
    if (processes[sessionId].tail !== null) processes[sessionId].tail.kill();
  }

  client.on('message', function(message) {
    console.log(sessionId + ': ' + message)
    active = parseInt(message)
    if (active !== processes[sessionId].active_log) {
      tail_stop();
      client.send({flush: true})
      tail_start(active);
    }
  });

  client.on('disconnect', function(){
    tail_stop();
  });
});
