var Q = require("q");
var fs = require("fs");
var mkdirp = require("mkdirp");
var shellPromises = require("./shellPromises");

exports.createWavAudioFromUpload = function(fileDetails, dbname, destinationDir) {
	var deferred,
		uploadFileId,
		currentWorkingDir,
		fileBaseName,
		resultDetails,
		wavCommand;

	resultDetails = JSON.parse(JSON.stringify(fileDetails));

	deferred = Q.defer();
	process.nextTick(function() {
		uploadFileId = resultDetails.path.substring(resultDetails.path.lastIndexOf("/") + 1);
		fileBaseName = resultDetails.name.substring(0, resultDetails.name.lastIndexOf("."));
		currentWorkingDir = destinationDir + "/" + dbname + "/" + fileBaseName;
		resultDetails.uploadFileId = uploadFileId;
		resultDetails.dbname = dbname;
		resultDetails.workingDir = currentWorkingDir;
		resultDetails.fileBaseName = fileBaseName;
		try {
			mkdirp.sync(currentWorkingDir, function(data) {
				console.log("mkdir callback " + data);
			});
		} catch (e) {
			if (e.errno !== 47) {
				console.log(e);
			} else {
				console.log("Dir was already ready.");
			}
		}

		if (fs.existsSync(currentWorkingDir + "/" + resultDetails.name)) {
			resultDetails.info = "Exists";
			deferred.resolve(resultDetails);
			return;
		}
		console.log(resultDetails.path);
		fs.renameSync(resultDetails.path, currentWorkingDir + "/" + resultDetails.name, function(data) {
			console.log("renameSync callback " + data);
		});

		wavCommand = "ffmpeg -i " + currentWorkingDir + "/" + resultDetails.name +
			" " + currentWorkingDir + "/" + fileBaseName + ".wav";
		shellPromises.execute(wavCommand).then(function(results) {
			console.log(results);
			deferred.resolve(resultDetails);
		});

	});
	return deferred.promise;
};

// var fs = require('fs-extra');
//   var filename = getName(movie.name);
//   var destination = 'utterances/' + filename;

//   fs.exists(destination, function(exists) {
//     if (exists) {
//       console.log('The file: ' + movie.name + ' already exists in: ' + destination);
//       return res.send('Already exists.');
//     } else {
//       fs.mkdirs(destination, function(error) {
//         if (error) {
//           throw error;
//         } else {
//           console.log('Successfully created subfolder: ' + destination);
//           fs.rename(movie.path, destination + '/' + movie.name, function(error) {
//             if (error) {
//               throw error;
//             } else {
//               console.log('Successfully copied ' + movie.name + ' to ' + destination);
//             }
//           });
//         }
//       });
//     }
//   });

//   var command = './extract_audio_from_video.sh ' + filename + ' ' + movie.name;
//   var child = exec(command, function(err, stdout, stderr) {
//     if (err) {
//       throw err;
//     } else {
//       console.log('Generated mp3 file');
//       var p = 'https://speechdev.lingsync.org/' + destination;
//       // var p = 'http://192.168.3.108:3184/' + destination;
//       console.log('sent path: ' + p);
//       res.send({url: p});
//     }
//   });
