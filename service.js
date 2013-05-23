var sys = require('sys');
var exec = require('child_process').exec;
var path = require('path');
var express = require('express');
var app = express();

// Configuration

app.configure(function() {
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

app.listen(3188);

// API calls

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

  var command = 'cd /home/jdhorner/fielddbworkspace/'
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

  res.writeHead(200, {
    'content-type' : 'application/json'
  });

  res.write(JSON.stringify({
    'textGrids' : [ {
      filename : "test_audio.wav",
      textGrid : "hi"
    }, {
      filename : "test_audio2.wav",
      textGrid : "hi"
    } ]
  }));

  res.end();

});

app.post('/progress', function(req, res) {

  console.log("got to my progress API");

});
