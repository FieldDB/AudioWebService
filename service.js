var https = require('https');
var node_config = require("./lib/nodeconfig_production");
var sys = require('sys');
var exec = require('child_process').exec;
var path = require('path');
var express = require('express');
//var cors = require('cors');
var app = express();

/*
 * Cross Origin Resource Sharing (CORS) Configuration, needed for for all HTML5
 * clients running on any domain to contact this webservice.
 */

//var corsOptions = {
//  origin : "*",
//  methods : "GET,PUT,POST"
//};

app.configure(function() {
  app.use(express.favicon());
  app.use(express.compress());
  app.use(express.logger());
  app.use(express.static(__dirname + '/utterances'));
  // app.use('/test', express.directory(__dirname + '/utterances'));
  app.use(express.limit(262144000));  // 250mb
  app.use(express.bodyParser({hash: 'md5'}));
  app.use(express.methodOverride());
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
});

// app.all('*', function(req, res, next) {
//   console.log('got to the star');
//   console.log('method: ' + req.method);
//   if (!req.get('Origin'))
//     return next();
//   res.set('Access-Control-Allow-Origin', '*');
//   res.set('Access-Control-Allow-Methods', 'GET, POST');
//   res.set('Access-Control-Allow-Headers', 'Origin, X-File-Name, X-Requested-With, Content-Type');
//   if ('OPTIONS' == req.method)
//     return res.send(200);
//   next();
// });

//API calls
//app.options('/upload', cors()); // enable preflight
//app.post('/upload', cors(corsOptions), function(req, res) {

app.post('/upload/extract/utterances', function(req, res) {

  function getName(f) {
    var i = f.lastIndexOf('.');
    return (i < 0) ? f : f.substring(0, i);
  }

  if (!req.files) {
    return res.send(404);
  }

  var movie = req.files.videoFile;
  var fs = require('fs-extra');
  var filename = getName(movie.name);
  var destination = 'utterances/' + filename;

  fs.mkdirsSync(destination, function(error) {
    if (error) {
      throw error;
    } else {
      console.log('Successfully created subfolder');
    }
  });

  fs.renameSync(movie.path, destination + '/' + movie.name, function(error) {
    if (error) {
      throw error;
    } else {
      console.log('Successfully copied ' + movie.name + ' to ' + destination);
    }
  });

  var command = './extract_audio_from_video.sh ' + filename + ' ' + movie.name;
  var child = exec(command, function(err, stdout, stderr) {
    if (err)
      throw err;
    else {
      console.log('Generated mp3 file');
      // var p = 'https://prosody.linguistics.mcgill.ca/audio/' + destination + filename + '.mp3';
      var p = 'https://voicedev.lingsync.org/' + destination + '/' + filename + '.mp3';
      console.log('sent path: ' + p);
      res.send({url: p});
    }
  });

});

app.get('/utterances/:id', function(req, res) {

  var folder = req.params.id;
  var path = 'utterances/' + folder + '/' + folder + '.mp3';

  res.sendfile(path);

});

app.post('/upload', function(req, res) {

  console.log('Got to my upload API');
  console.log(req.body);

  var filesToUpload = req.files.filesToUpload[0];
  var fs = require('fs.extra');
  var p1 = '../storage/audio/';
  var p2 = '../storage/dictionaries/';
  var p3 = '../Prosodylab-Aligner/tmp/';
  var p4 = '../Prosodylab-Aligner/';

  console.log(filesToUpload);

  for (var i in filesToUpload) {
    (function(index) {
      var a = filesToUpload[index];
      switch (a.type) {
      case 'audio/wav':
        fs.copy(a.path, p1 + a.name, function(error) {
          if (error) {
            throw error;
          }
          console.log('Successfully copied ' + a.name + ' to ' + p1);
          fs.copy(a.path, p3 + a.name, function(error) {
            if (error) {
              throw error;
            }
            console.log('Successfully copied ' + a.name + ' to ' + p3);
            fs.unlink(a.path,
                function(error) {
                  if (error) {
                    throw error;
                  }
                  console.log('Successfully removed ' + a.name + ' from ' + a.path);
                });
          });
        });
        break;
      case 'audio/mp3':
        fs.copy(a.path, p1 + a.name, function(error) {
          if (error) {
            throw error;
          }
          console.log('Successfully copied ' + a.name + ' to ' + p1);
          fs.copy(a.path, p3 + a.name, function(error) {
            if (error) {
              throw error;
            }
            console.log('Successfully copied ' + a.name + ' to ' + p3);
            fs.unlink(a.path,
                function(error) {
                  if (error) {
                    throw error;
                  }
                  console.log('Successfully removed ' + a.name + ' from ' + a.path);
                });
          });
        });
        break;
      case 'text/plain':
        fs.copy(a.path, p2 + a.name, function(error) {
          if (error) {
            throw error;
          }
          console.log('Successfully copied ' + a.name + ' to ' + p2);
          fs.copy(a.path, p3 + a.name, function(error) {
            if (error) {
              throw error;
            }
            console.log('Successfully copied ' + a.name + ' to ' + p3);
            fs.unlink(a.path,
                function(error) {
                  if (error) {
                    throw error;
                  }
                  console.log('Successfully removed ' + a.name + ' from ' + a.path);
                });
          });
        });
        break;
      case 'application/octet-stream':
        fs.rename(a.path, p3 + a.name, function(error) {
          if (error) {
            throw error;
          }
          console.log('Successfully copied ' + a.name + ' to ' + p3);
          console.log('Successfully removed ' + a.name + ' from ' + a.path);
        });
        break;
      }
    })(i);
  }

  var command = 'cd $HOME/fielddbworkspace/' + 'Prosodylab-Aligner && ./align.py -d ./tmp/dictionary.txt ./tmp';
  var child = exec(command, function(err, stdout, stderr) {
    if (err)
      throw err;
    else {
      console.log('generated textgrid');
      var p = path.resolve('../Prosodylab-Aligner/tmp/testing_audio.TextGrid');
      res.download(p, 'testing_audio.TextGrid');
    }
  });

});

app.post('/textgrids', function(req, res) {

  console.log('got to my textgrid API');
  console.log(req.body);

  /*
   * TODO check to see if the text grids on couchdb are built with these
   * materials? YES: return the textgrids NO: run it again
   */
  res.send({
    'textGrids' : [{
      corpus: {},
      filename: 'test_audio.wav',
      textGrid: 'hi'
    }, {
      corpus: {},
      filename: 'test_audio2.wav',
      textGrid: 'hi'
    }]
  });

});

app.post('/progress', function(req, res) {
  res.send('50');
  console.log('got to my progress API');

});

/*
 * HTTPS Configuration, needed for for all HTML5 chrome app clients to contact
 * this webservice. As well as a general security measure.
 */
var fss = require('fs');
node_config.httpsOptions.key = fss.readFileSync(node_config.httpsOptions.key);
node_config.httpsOptions.cert = fss.readFileSync(node_config.httpsOptions.cert);

https.createServer(node_config.httpsOptions, app).listen(node_config.port);
// app.listen(node_config.port);
console.log('AudioWebService listening on port ' + node_config.port);
