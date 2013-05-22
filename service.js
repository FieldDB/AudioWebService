var sys = require('sys');
var exec = require('child_process').exec;

var express = require('express');
var app = express();

// Configuration

app.configure(function() {
  app.use(express.logger());
  app.use(express.compress());
  app.use(express.bodyParser({
    hash : 'md5'
  }));
  app.use(express.static(__dirname + '/public'));
  app.use(express.errorHandler({
    dumpExceptions : true,
    showStack : true
  }));
});

app.listen(3188);

// API calls

app
    .post(
        '/upload',
        function(req, res) {

          console.log("Got to my upload API");

          var filesToUpload = req.files.filesToUpload[0];

          console.log(filesToUpload);
          console.log(req.body);

          var firstFile = filesToUpload[0];
          var serverPath = '/upload/' + firstFile.name;

          require('fs')
              .rename(
                  firstFile.path,
                  '/home/jdhorner/git/mytest/manager/public' + serverPath,
                  function(error) {

                    if (error) {
                      res.send({
                        error : 'Ah crap! Something bad happened'
                      });
                      return;
                    }

                    var command = 'cd /home/jdhorner/fielddbworkspace/Prosodylab-Aligner && ./align.py data/';
                    var child = exec(
                        command,
                        function(err, stdout, stderr) {
                          if (err)
                            throw err;
                          else
                            console
                                .log('Aligner ran and hopefully did something!');

                        });

                    res.send({
                      'ok' : true,
                      'textGrids' : [ {
                        filename : "test_audio.wav",
                        textGrid : "hi"
                      }, {
                        filename : "test_audio2.wav",
                        textGrid : "hi"
                      } ]
                    });
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
