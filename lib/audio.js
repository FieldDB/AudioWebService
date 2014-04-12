var Q = require("q");
var fs = require("fs");
var mkdirp = require("mkdirp");
var checksum = require("checksum");
var shellPromises = require("./shellPromises");
var TextGrid = require('./TextGrid').TextGrid;

var updateSymlink = function(source, destination) {
	var info,
		existingSymLink;

	try {
		existingSymLink = fs.readlinkSync(destination);
	} catch (e) {
		// probably didnt exist
	}
	if (existingSymLink && existingSymLink === source) {
		info = "matches";
	}
	if (existingSymLink && existingSymLink !== source) {
		info = "different";
		fs.unlinkSync(destination);
	}
	if (!existingSymLink) {
		info = "new";
	}
	if (!existingSymLink || existingSymLink !== source) {
		fs.symlinkSync(source, destination, "file");
	}
	// console.log(info);
	return info;
};

exports.createWavAudioFromUpload = function(filesWithDetails, dbname, rawDir, destinationDir) {
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
		for (var fileindex = 0; fileindex < resultDetails.length; fileindex++) {
			var individualDeferred = Q.defer();
			promises.push(individualDeferred);

			fileBaseName = resultDetails[fileindex].name.substring(0, resultDetails[fileindex].name.lastIndexOf("."));
			currentWorkingDir = destinationDir + "/" + dbname + "/" + fileBaseName;
			resultDetails[fileindex].currentWorkingDir = currentWorkingDir;
			resultDetails[fileindex].fileBaseName = fileBaseName;
			resultDetails[fileindex].dbname = dbname;
			(function(fileDetails) {

				checksum.file(fileDetails.path, function(error, checksumResults) {
					if (error) {
						console.log(reason);
						individualDeferred.reject(reason);
						return;
					}
					uploadFileId = checksumResults;
					console.log("uploadFileId " + uploadFileId);

					fileDetails.uploadFileId = uploadFileId;
					fileDetails.checksum = checksumResults;

					try {
						mkdirp.sync(rawDir, function(data) {
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
						mkdirp.sync(fileDetails.currentWorkingDir, function(data) {
							console.log("mkdir callback " + data);
						});
					} catch (e) {
						if (e.errno !== 47) {
							console.log(e);
						} else {
							console.log("Dir was already ready.");
						}
					}

					if (fs.existsSync(rawDir + "/" + uploadFileId)) {
						fileDetails.info = "Exists";
						fileDetails.uploadStatus = 304;
					} else {
						fs.renameSync(fileDetails.path, rawDir + "/" + uploadFileId, function(data) {
							console.log("renameSync callback " + data);
						});
					}

					//create sym link to checksum to permit multiple files in the corpus to be the same file and not consume extra disk space
					fileDetails.info = updateSymlink(rawDir + "/" + uploadFileId,
						fileDetails.currentWorkingDir + "/" + fileDetails.name);
					console.log("Original: " + fileDetails.info);

					// If this uploaded file has had a wav already made from it, don't regenerate it.
					console.log("Verifying wav.");
					if (fs.existsSync(rawDir + "/" + uploadFileId + ".wav")) {
						console.log(new Date() + "This audio/video file already had a corresponding wav, not regenerating it");
						fileDetails.wavStatus = 304;
						fileDetails.wavinfo = updateSymlink(rawDir + "/" + uploadFileId + ".wav",
							fileDetails.currentWorkingDir + "/" + fileDetails.fileBaseName + ".wav");
						console.log("Wav: " + fileDetails.wavinfo);
						// delete fileDetails.currentWorkingDir;
						// delete fileDetails.uploadFileId;
						new TextGrid({
							workingDir: fileDetails.currentWorkingDir,
							wavFile: fileDetails.fileBaseName + ".wav"
						}).generate().then(
							function() {
								individualDeferred.resolve(fileDetails);
							});
					} else {
						wavCommand = "ffmpeg -i " + fileDetails.currentWorkingDir + "/" + fileDetails.name +
							" " + fileDetails.currentWorkingDir + "/" + fileDetails.fileBaseName + ".wav";
						console.log(new Date() + "Generating wav...");

						shellPromises.execute(wavCommand).then(function(results) {
							console.log(results);
							fileDetails.wavStatus = 200;
							fs.renameSync(fileDetails.currentWorkingDir + "/" + fileDetails.fileBaseName + ".wav", rawDir + "/" + uploadFileId + ".wav");
							fileDetails.wavinfo = updateSymlink(rawDir + "/" + uploadFileId + ".wav",
								fileDetails.currentWorkingDir + "/" + fileDetails.fileBaseName + ".wav");
							console.log("Wav: " + fileDetails.wavinfo);
							// delete fileDetails.currentWorkingDir;
							// delete fileDetails.uploadFileId;
							new TextGrid({
								workingDir: fileDetails.currentWorkingDir,
								wavFile: fileDetails.fileBaseName + ".wav"
							}).generate().then(
								function() {
									individualDeferred.resolve(fileDetails);
								});
						}, function(reason) {
							console.log(reason);
							individualDeferred.reject(reason);
						});
					}

				});

			})(resultDetails[fileindex]);
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
