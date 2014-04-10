var https = require('https');
var node_config = require("./lib/nodeconfig_local");
var audio = require("./lib/audio");
var sys = require('sys');
var exec = require('child_process').exec;
var shellPromises = require("./lib/shellPromises");
var path = require('path');
var fs = require('fs');
var TextGrid = require('./lib/TextGrid').TextGrid;
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
try {
    fs.mkdirSync(node_config.audioVideoCacheDir, function(data) {
        console.log("mkdir callback " + data);
    });
} catch (e) {
    if (e.errno !== 47) {
        console.log(e);
    } else {
        console.log("Dir was already ready.");
    }
}
try {
    fs.mkdirSync(node_config.audioVideoDataDir, function(data) {
        console.log("mkdir callback " + data);
    });
} catch (e) {
    if (e.errno !== 47) {
        console.log(e);
    } else {
        console.log("Dir was already ready.");
    }
}


app.configure(function() {
  app.use(express.favicon());
  app.use(express.compress());
  app.use(express.logger());
  app.use(express.limit(262144000));  // 250mb
  app.use(express.bodyParser({
    hash: 'sha1',
    checksum: 'sha1',
    uploadDir: node_config.audioVideoCacheDir
  }));
  app.use('/utterances', express.directory(__dirname + '/utterances'));
  app.use('/utterances', express.static(__dirname + '/utterances'));
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
  var audioVideoFileDetails,
    dbname,
    textGridCommand;

  function getName(f) {
    var i = f.lastIndexOf('.');
    return (i < 0) ? f : f.substring(0, i);
  }

  if (!req.files) {
    return res.send(404);
  }

  audioVideoFileDetails = req.files.videoFile ? req.files.videoFile : req.files.files[0];
  dbname = req.body.dbname;

  console.log("Generating Wav");
  audio.createWavAudioFromUpload(audioVideoFileDetails, dbname, node_config.audioVideoDataDir)
    .then(function(result) {
        audioVideoFileDetails = result;

        console.log("Generating TextGrid");
        textGridCommand = node_config.praatCommand + __dirname + "/praatfiles/praat-script-syllable-nuclei-v2file.praat -26 0.1 0.4 yes " + audioVideoFileDetails.workingDir + " " + audioVideoFileDetails.fileBaseName + ".wav "; //+ " 2>&1 ";
        delete audioVideoFileDetails.workingDir;
        delete audioVideoFileDetails.uploadFileId;

        shellPromises.execute(textGridCommand)
          .then(function(results) {
            console.log(results);
          }, function(reason) {
            console.log("Error");
            console.log(reason);
          });
      },
      function(reason) {
        console.log("Error");
        console.log(reason);
      })
    .fin(function() {
      res.send({
        result: audioVideoFileDetails
      });
    });
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

  console.log(req.files);
  var currentFileName  = "audiofilename";
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
 
 try{
  currentFileName = filesToUpload[0].name.substring(0,filesToUpload[0].name.lastIndexOf("."));
 } catch(e){
  console.loge(e);
 }
  var command = 'cd $FIELDDB_HOME/' + 'Prosodylab-Aligner && ./align.py -d ./tmp/dictionary.txt ./tmp';
  var child = exec(command, function(err, stdout, stderr) {
    if (err)
      throw err;
    else {
      console.log('generated textgrid');
      var p = path.resolve('../Prosodylab-Aligner/tmp/' + currentFileName + '.TextGrid');
      res.download(p, currentFileName+'.TextGrid');
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


app.get('/videofilenames', function(req, res) {

  console.log('got to the videofilenames API');
  var dir = 'utterances/'; // your directory

  // var files = fs.readdirSync(dir);
  // files.sort(function(a, b) {
  //   return fs.statSync(dir + a).mtime.getTime() -
  //     fs.statSync(dir + b).mtime.getTime();
  // });
  /* cached version */
  var files = fs.readdirSync(dir)
    .map(function(v) {
      return {
        name: v,
        time: fs.statSync(dir + v).mtime.getTime()
      };
    })
    .sort(function(a, b) {
      return a.time - b.time;
    })
    .map(function(v) {
      return v.name;
    });
    console.log(files);
    res.send(files);
});


/*
 * HTTPS Configuration, needed for for all HTML5 chrome app clients to contact
 * this webservice. As well as a general security measure.
 */
node_config.httpsOptions.key = fs.readFileSync(node_config.httpsOptions.key);
node_config.httpsOptions.cert = fs.readFileSync(node_config.httpsOptions.cert);

https.createServer(node_config.httpsOptions, app).listen(node_config.port);
//app.listen(node_config.port);
console.log('AudioWebService listening on port ' + node_config.port);
