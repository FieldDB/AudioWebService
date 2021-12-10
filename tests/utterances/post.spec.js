var expect = require("chai").expect;
var supertest = require("supertest");

var service = require("../../audio-service");
var server;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

describe("post utterances", function() {
  before(function(done) {
    if (process.env.URL) {
      // Production server is using http behind nginx
      if (process.env.NODE_ENV === "production") {
        process.env.URL = "http://localhost:3184";
      }
      return done();
    }

    server = service.listen(0, function(err) {
      if (err) {
        return done(err)
      }
      console.log('listening at localhost');
      done();
    });
    // rm -rf bycorpus/testingupload-firstcorpus/
  });

  after(function() {
    if (!server) {
      return;
    }
    server.close();
  });

  it("should accept short audio", function() {
    // console.log('service', service);
    return supertest(service)
      .post("/upload/extract/utterances")
      .attach("files[]", "sphinx4files/lattice/10001-90210-01803.wav")
      .field("token", "mytokengoeshere")
      .field("username", "testingupload")
      .field("dbname", "testingupload-firstcorpus")
      .then(function(res) {
        expect(res.status).to.equal(200, JSON.stringify(res.body));
        expect(res.body).to.deep.equal({
          "status": 200,
          "files": [{
            "size": 265914,
            "name": "10001-90210-01803.wav",
            "type": "audio/wave",
            "mtime": res.body.files[0].mtime,
            "fileBaseName": "10001-90210-01803",
            "praatAudioExtension": ".mp3",
            "script": "Syllables",
            "dbname": "testingupload-firstcorpus",
            "checksum": "20c4af3c30b84697a8b69edb4c4b2b39739451c3",
            "uploadInfo": "new",
            "uploadStatus": 304,
            "resultStatus": 304,
            "resultInfo": "new",
            "syllablesAndUtterances": {
              "fileBaseName": "10001-90210-01803",
              "syllableCount": "15",
              "pauseCount": "2",
              "totalDuration": "8.36",
              "speakingTotalDuration": "5.15",
              "speakingRate": "1.79",
              "articulationRate": "2.91",
              "averageSylableDuration": "0.344",
              "scriptVersion": "v1.102.2",
              "minimum_duration": 0.6,
              "maximum_intensity": 59,
              "minimum_pitch": 100,
              "time_step": 0,
              "window_size": 20,
              "margin": 0.1
            },
            "textGridInfo": "regenerated",
            "textGridStatus": 200,
            "webResultStatus": 304,
            "webResultInfo": "matches",
            "serviceVersion": "3.16.13"
          }]
        });
      });
  });

  it("should accept amr audio from androids", function() {
    this.timeout(60 * 1000);
    // cp 13157700051593730_2011-09-11_15.41_1315770072221_.mp3 13157700051593730_2011-09-11_15.41_1315770072221_.amr
    return supertest(service)
      .post("/upload/extract/utterances")
      .attach("files[]", "13157700051593730_2011-09-11_15.41_1315770072221_.amr")
      .field("token", "mytokengoeshere")
      .field("username", "testingupload")
      .field("dbname", "testingupload-firstcorpus")
      .then(function(res) {
        expect(res.status).to.equal(200, JSON.stringify(res.body));
        expect(res.body).to.deep.equal({
          "status": 200,
          "files": [{
            "size": 3489389,
            "name": "13157700051593730_2011-09-11_15.41_1315770072221_.amr",
            "type": "application/octet-stream",
            "mtime": res.body.files[0].mtime,
            "fileBaseName": "13157700051593730_2011-09-11_15_41_1315770072221_",
            "praatAudioExtension": ".mp3",
            "script": "Syllables",
            "dbname": "testingupload-firstcorpus",
            "checksum": "4d4e6e63f022a05f1c9af67d70be895ed4569319",
            "uploadInfo": "new",
            "uploadStatus": 304,
            "resultStatus": 304,
            "resultInfo": "new",
            "syllablesAndUtterances": {
              "fileBaseName": "13157700051593730_2011-09-11_15_41_1315770072221_",
              "syllableCount": process.env.GITHUB_ACTIONS ? "3335" : "3332",
              "pauseCount": process.env.GITHUB_ACTIONS ? "722" : "723",
              "totalDuration": "2112.94",
              "speakingTotalDuration": process.env.GITHUB_ACTIONS ? "820.85" : "820.79",
              "speakingRate": "1.58",
              "articulationRate": "4.06",
              "averageSylableDuration": "0.246",
              "scriptVersion": "v1.102.2",
              "minimum_duration": 0.6,
              "maximum_intensity": 59,
              "minimum_pitch": 100,
              "time_step": 0,
              "window_size": 20,
              "margin": 0.1
            },
            "textGridInfo": "regenerated",
            "textGridStatus": 200,
            "webResultStatus": 304,
            "webResultInfo": "matches",
            "serviceVersion": "3.16.13"
          }]
        });
      });
  });

  it("should accept multiple files", function() {
    return supertest(service)
      .post("/upload/extract/utterances")
      .attach("files", "tests/data/alo.mp3")
      .attach("files", "tests/data/ara.mp3")
      .field("token", "mytokengoeshere")
      .field("username", "testingupload")
      .field("dbname", "testingupload-firstcorpus")
      .then(function(res) {
        expect(res.status).to.equal(200, JSON.stringify(res.body));
        console.log(JSON.stringify(res.body.files[0]))
        expect(res.body).to.deep.equal({
          "status": 200,
          "files": [{
            "size": 31414,
            "name": "alo.mp3",
            "type": "audio/mpeg",
            "mtime": res.body.files[0].mtime,
            "fileBaseName": "alo",
            "praatAudioExtension": ".mp3",
            "script": "Syllables",
            "dbname": "testingupload-firstcorpus",
            "checksum": "ee87dd8f1e6a78e9b96cdf3e1b2ff8a964d10992",
            "uploadInfo": "new",
            "uploadStatus": 304,
            "resultStatus": 304,
            "resultInfo": "different",
            "syllablesAndUtterances": {
              "fileBaseName": "alo",
              "syllableCount": "2",
              "pauseCount": "0",
              "totalDuration": "1.59",
              "speakingTotalDuration": "0.72",
              "speakingRate": "1.26",
              "articulationRate": "2.78",
              "averageSylableDuration": "0.360",
              "scriptVersion": "v1.102.2",
              "minimum_duration": 0.6,
              "maximum_intensity": 59,
              "minimum_pitch": 100,
              "time_step": 0,
              "window_size": 20,
              "margin": 0.1
            },
              "textGridInfo": "regenerated",
              "textGridStatus": 200,
              "webResultStatus": 304,
              "webResultInfo": "matches",
              "serviceVersion": "3.16.13"
            }, {
            "size": 18875,
            "name": "ara.mp3",
            "type": "audio/mpeg",
            "mtime": res.body.files[1].mtime,
            "fileBaseName": "ara",
            "praatAudioExtension": ".mp3",
            "script": "Syllables",
            "dbname": "testingupload-firstcorpus",
            "checksum": "7825487cf8f7dd9f35de6e068e8f227a38e9744b",
            "uploadInfo": "new",
            "uploadStatus": 304,
            "resultStatus": 304,
            "resultInfo": "different",
            "syllablesAndUtterances": {
              "fileBaseName": "ara",
              "syllableCount": "1",
              "pauseCount": "0",
              "totalDuration": "0.96",
              "speakingTotalDuration": "0.96",
              "speakingRate": "1.04",
              "articulationRate": "1.04",
              "averageSylableDuration": "0.964",
              "scriptVersion": "v1.102.2",
              "minimum_duration": 0.6,
              "maximum_intensity": 59,
              "minimum_pitch": 100,
              "time_step": 0,
              "window_size": 20,
              "margin": 0.1
            },
            "textGridInfo": "regenerated",
            "textGridStatus": 200,
            "webResultStatus": 304,
            "webResultInfo": "matches",
            "serviceVersion": "3.16.13"
          }]
        });
      });
  });

  it("should accept long movies", function() {
    this.timeout(60 * 1000);
    if (process.env.GITHUB_ACTIONS) {
      console.log("  skipping due to large file not present in GITHUB_ACTIONS")
      this.skip();
    }
    return supertest(service)
      .post("/upload/extract/utterances")
      .attach("files[]", "tests/data/ჩემი\ ცოლის\ დაქალის\ ქორწილი\ \[HD\].mp4")
      .field("token", "mytokengoeshere")
      .field("username", "testingupload")
      .field("dbname", "testingupload-firstcorpus")
      .then(function(res) {
        expect(res.status).to.equal(200, JSON.stringify(res.body));
        expect(res.body).to.deep.equal({
          "status": 200,
          "files": [{
            "size": 1250782156,
            "name": "ჩემი_ცოლის_დაქალის_ქორწილი_[HD].mp4",
            "type": "video/mp4",
            "mtime": res.body.files[0].mtime,
            "fileBaseName": "ჩემი_ცოლის_დაქალის_ქორწილი__HD_",
            "praatAudioExtension": ".wav",
            "script": "LongSound",
            "dbname": "testingupload-firstcorpus",
            "checksum": "5abb1a2ceabc538665069c4a5caa54ceef546d87",
            "uploadInfo": "new",
            "uploadStatus": 304,
            "resultStatus": 304,
            "resultInfo": "new",
            "syllablesAndUtterances": {
              "fileBaseName": "ჩემი_ცოლის_დაქალის_ქორწილი__HD_",
              "syllableCount": "0",
              "pauseCount": "1041",
              "totalDuration": "0",
              "speakingTotalDuration": "0",
              "speakingRate": "0",
              "articulationRate": "0",
              "averageSylableDuration": "0",
              "scriptVersion": "v1.102.2",
              "minimum_duration": 0.6,
              "maximum_intensity": 59,
              "minimum_pitch": 100,
              "time_step": 0,
              "window_size": 20,
              "margin": 0.1
            },
            "textGridInfo": "regenerated",
            "textGridStatus": 200,
            "serviceVersion": "3.16.13"
          }]
        });
      });
  });

  it("should accept .raw audio (from android pocketsphinx and other)", function() {
    return supertest(service)
      .post("/upload/extract/utterances")
      .attach("files[]", "testinstallpocketsphinx/android_16k.raw")
      .field("token", "mytokengoeshere")
      .field("username", "testingupload")
      .field("dbname", "testingupload-firstcorpus")
      .then(function(res) {
        expect(res.status).to.equal(200, JSON.stringify(res.body));
        expect(res.body).to.deep.equal({
          "status": 200,
          "files": [{
            "size": 182272,
            "name": "android_16k.raw",
            "type": "application/octet-stream",
            "mtime": res.body.files[0].mtime,
            "fileBaseName": "android_16k",
            "praatAudioExtension": ".mp3",
            "script": "Syllables",
            "dbname": "testingupload-firstcorpus",
            "checksum": "bf06325033e361980dbc41fbd5a368cdb5500671",
            "uploadInfo": "new",
            "uploadStatus": 304,
            "resultStatus": 304,
            "resultInfo": "new",
            "syllablesAndUtterances": {
              "fileBaseName": "android_16k",
              "syllableCount": "25",
              "pauseCount": "0",
              "totalDuration": "5.76",
              "speakingTotalDuration": "5.22",
              "speakingRate": "4.34",
              "articulationRate": "4.79",
              "averageSylableDuration": "0.209",
              "scriptVersion": "v1.102.2",
              "minimum_duration": 0.6,
              "maximum_intensity": 59,
              "minimum_pitch": 100,
              "time_step": 0,
              "window_size": 20,
              "margin": 0.1
            },
            "textGridInfo": "regenerated",
            "textGridStatus": 200,
            "webResultStatus": 304,
            "webResultInfo": "matches",
            "serviceVersion": "3.16.13"
          }]
        });
      });
  });
});

// ls noqata_tusunayawami.mp3 || {
//  curl -O --retry 999 --retry-max-time 0 -C - https://github.com/OpenSourceFieldlinguistics/FieldDB/blob/master/sample_data/noqata_tusunayawami.mp3?raw=true
//  mv "noqata_tusunayawami.mp3?raw=true" noqata_tusunayawami.mp3
// }

// 15602
