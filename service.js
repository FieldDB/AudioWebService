var https = require('https');
var node_config = require("./lib/nodeconfig_devserver");
var sys = require('sys');
var exec = require('child_process').exec;
var path = require('path');
var express = require('express');
var cors = require('cors');
var app = express();

/*
 * Cross Origin Resource Sharing (CORS) Configuration, needed for for all HTML5
 * clients running on any domain to contact this webservice.
 */
var corsOptions = {
  origin : true
};

app.configure(function() {
  app.use(cors());
  app.use(express.logger());
  app.use(express.compress());
  app.use(express.bodyParser({
    hash : 'md5'
  }));
  app.use(express.errorHandler({
    dumpExceptions : true,
    showStack : true
  }));
});

/*
 * HTTPS Configuration, needed for for all HTML5 chrome app clients to contact
 * this webservice. As well as a general security measure.
 */
var fs = require('fs');
node_config.httpsOptions.key = fs.readFileSync(node_config.httpsOptions.key);
node_config.httpsOptions.cert = fs.readFileSync(node_config.httpsOptions.cert);
https.createServer(node_config.httpsOptions, app).listen(node_config.port);
console.log("AudioWebService listening on port " + node_config.port);

// API calls
app.options('/upload', cors()); // enable preflight request for DELETE request
app.post('/upload', function(req, res) {

  console.log("Got to my upload API");
  console.log(req.body);

  var filesToUpload = req.files.filesToUpload[0];
  var fs = require('fs.extra');
  var p1 = "../storage/audio/";
  var p2 = "../storage/dictionaries/";
  var p3 = "../Prosodylab-Aligner/tmp/";
  var p4 = "../Prosodylab-Aligner/";

  console.log(filesToUpload);

  for ( var i in filesToUpload) {
    (function(index) {
      var a = filesToUpload[index];
      switch (a.type) {
      case "audio/wav":
        fs.copy(a.path, p1 + a.name, function(error) {
          if (error) {
            throw error;
          }
          console.log("Successfully copied " + a.name + " to " + p1);
          fs.copy(a.path, p3 + a.name, function(error) {
            if (error) {
              throw error;
            }
            console.log("Successfully copied " + a.name + " to " + p3);
            fs.unlink(a.path,
                function(error) {
                  if (error) {
                    throw error;
                  }
                  console.log("Successfully removed " + a.name + " from "
                      + a.path);
                });
          });
        });
        break;
      case "audio/mp3":
        fs.copy(a.path, p1 + a.name, function(error) {
          if (error) {
            throw error;
          }
          console.log("Successfully copied " + a.name + " to " + p1);
          fs.copy(a.path, p3 + a.name, function(error) {
            if (error) {
              throw error;
            }
            console.log("Successfully copied " + a.name + " to " + p3);
            fs.unlink(a.path,
                function(error) {
                  if (error) {
                    throw error;
                  }
                  console.log("Successfully removed " + a.name + " from "
                      + a.path);
                });
          });
        });
        break;
      case "text/plain":
        fs.copy(a.path, p2 + a.name, function(error) {
          if (error) {
            throw error;
          }
          console.log("Successfully copied " + a.name + " to " + p2);
          fs.copy(a.path, p3 + a.name, function(error) {
            if (error) {
              throw error;
            }
            console.log("Successfully copied " + a.name + " to " + p3);
            fs.unlink(a.path,
                function(error) {
                  if (error) {
                    throw error;
                  }
                  console.log("Successfully removed " + a.name + " from "
                      + a.path);
                });
          });
        });
        break;
      case "application/octet-stream":
        fs.rename(a.path, p3 + a.name, function(error) {
          if (error) {
            throw error;
          }
          console.log("Successfully copied " + a.name + " to " + p3);
          console.log("Successfully removed " + a.name + " from " + a.path);
        });
        break;
      }
    })(i);
  }

  // var firstFile = filesToUpload[0];
  // var serverPath = '/upload/' + firstFile.name;
  //
  // require('fs')
  // .rename(
  // firstFile.path,
  // '/home/jdhorner/fielddbworkspace/Prosodylab-Aligner/tmp'
  // + serverPath,
  // function(error) {
  //
  // if (error) {
  // res.send({
  // error : 'Ah crap! Something bad happened'
  // });
  // return;
  // }

  var command = 'cd $HOME/fielddbworkspace/'
      + 'Prosodylab-Aligner && ./align.py -d ./tmp/dictionary.txt ./tmp';
  var child = exec(command, function(err, stdout, stderr) {
    if (err)
      throw err;
    else {
      console.log("generated textgrid");
      var p = path.resolve("../Prosodylab-Aligner/tmp/testing_audio.TextGrid");
      res.download(p, "testing_audio.TextGrid");
    }
  });

});

app.post('/textgrids', function(req, res) {

  console.log("got to my textgrid API");
  console.log(req.body);

  /*
   * TODO check to see if the text grids on couchdb are built with these
   * materials? YES: return the textgrids NO: run it again
   */
  res.send({
    'textGrids' : [ {
      corpus : {},
      filename : "test_audio.wav",
      textGrid : "hi"
    }, {
      corpus : {},
      filename : "test_audio2.wav",
      textGrid : "hi"
    } ]
  });

});

app.post('/progress', function(req, res) {
  res.send("50");
  console.log("got to my progress API");

});
