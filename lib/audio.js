var Q = require("q");
var fs = require("fs");
var mkdirp = require("mkdirp");
var shellPromises = require("./shellPromises");

exports.createWavAudioFromUpload = function(filesWithDetails, dbname, destinationDir) {
	var deferred,
		uploadFileId,
		currentWorkingDir,
		fileBaseName,
		resultDetails,
		wavCommand,
		promises = [];

	resultDetails = JSON.parse(JSON.stringify(filesWithDetails));

	deferred = Q.defer();
	process.nextTick(function() {
		console.log("resultDetails");
		console.log(resultDetails);
		for (var fileindex = 0; fileindex < resultDetails.length; fileindex++) {
			var individualDeferred = Q.defer();
			promises.push(individualDeferred);

			uploadFileId = resultDetails[fileindex].path.substring(resultDetails[fileindex].path.lastIndexOf("/") + 1);
			console.log("uploadFileId " + uploadFileId);
			fileBaseName = resultDetails[fileindex].name.substring(0, resultDetails[fileindex].name.lastIndexOf("."));
			currentWorkingDir = destinationDir + "/" + dbname + "/" + fileBaseName;
			resultDetails[fileindex].uploadFileId = uploadFileId;
			resultDetails[fileindex].dbname = dbname;
			resultDetails[fileindex].workingDir = currentWorkingDir;
			resultDetails[fileindex].fileBaseName = fileBaseName;
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

			if (fs.existsSync(currentWorkingDir + "/" + resultDetails[fileindex].name)) {
				resultDetails[fileindex].info = "Exists";
				resultDetails[fileindex].wavStatus = 304;
				individualDeferred.resolve(resultDetails[fileindex]);
				continue;
			} else {
				resultDetails[fileindex].wavStatus = 200;
			}
			console.log(resultDetails[fileindex].path);
			fs.renameSync(resultDetails[fileindex].path, currentWorkingDir + "/" + resultDetails[fileindex].name, function(data) {
				console.log("renameSync callback " + data);
			});

			wavCommand = "ffmpeg -i " + currentWorkingDir + "/" + resultDetails[fileindex].name +
				" " + currentWorkingDir + "/" + fileBaseName + ".wav";
			shellPromises.execute(wavCommand).then(function(results) {
				console.log(results);
				individualDeferred.resolve(resultDetails[fileindex]);
			}, function(reason) {
				console.log(reason);
				individualDeferred.reject(reason);
			});
		}
		console.log("promises" + promises.length);
		if (promises.length === 0) {
			deferred.resolve(resultDetails);
		} else {
			Q.allSettled(promises)
				.fin(function() {
					deferred.resolve(resultDetails);
				});

		}


	});
	return deferred.promise;
};
