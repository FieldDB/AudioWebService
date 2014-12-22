var Q = require("q");
var fs = require("fs");
var mkdirp = require("mkdirp");
var checksum = require("checksum");
var shellPromises = require("./shellPromises");
var TextGrid = require('./TextGrid').TextGrid;

var webPlayableResultAudioExtension = ".mp3";
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

var generateTextGrid = function(localFileDetails, localRawDir, localDeferredPromise) {
	console.log(new Date() + " " + localFileDetails.fileBaseName + " Audio Result: " + localFileDetails.resultInfo);
	new TextGrid({
		workingDir: localFileDetails.currentWorkingDir,
		audioFile: localFileDetails.fileBaseName + localFileDetails.praatAudioExtension,
		script: localFileDetails.script
	}).generate()
		.then(function(textGridResults) {
			console.log(new Date() + " " + localFileDetails.fileBaseName + " TextGrid completed ");
			localFileDetails.syllablesAndUtterances = textGridResults;
			localFileDetails.textGridInfo = "regenerated";
			localFileDetails.textGridStatus = 200;
			if (localFileDetails.script === "Syllables") {
				fs.renameSync(localFileDetails.currentWorkingDir + "/" + localFileDetails.fileBaseName + localFileDetails.praatAudioExtension + ".TextGrid", localFileDetails.currentWorkingDir + "/" + localFileDetails.fileBaseName + ".TextGrid");
			}
			localDeferredPromise.resolve(localFileDetails);
			ensureWebPlayableAudioExists(localFileDetails, localRawDir);
		})
		.fail(function(reason) {
			console.log("fail generate textgrid based on new audio file");
			console.log(reason);
			if (reason.indexOf("ontains no audio data.") > -1 || reason.indexOf("File not recognized ") > -1) {
				reason = "File “" + localFileDetails.name + "” contains no audio data. You can import any audio/video file which contains an audio track. Are you sure this file has an audio track?";
				localFileDetails.textGridStatus = 422;
			} else {
				localFileDetails.textGridStatus = 500;
			}
			localFileDetails.textGridInfo = reason;
			console.log(reason);
			localDeferredPromise.reject(reason);
		});
};

var ensureWebPlayableAudioExists = function(localFileDetails, localRawDir) {
	console.log(new Date() + " " + localFileDetails.fileBaseName + " Verifying web playable result.");
	if (fs.existsSync(localRawDir + "/" + localFileDetails.uploadFileId + webPlayableResultAudioExtension)) {
		console.log(new Date() + " " + localFileDetails.fileBaseName + " This audio/video file already had a corresponding web playable audio result, not regenerating it");
		localFileDetails.webResultStatus = 304;
		localFileDetails.webResultInfo = updateSymlink(localRawDir + "/" + localFileDetails.uploadFileId + webPlayableResultAudioExtension,
			localFileDetails.currentWorkingDir + "/" + localFileDetails.fileBaseName + webPlayableResultAudioExtension);
	} else {
		audioResultCommand = "ffmpeg -y -i \"" + localFileDetails.currentWorkingDir + "/" + localFileDetails.name +
			"\" -ac 1 -ar 22050 \"" + localFileDetails.currentWorkingDir + "/" + localFileDetails.fileBaseName + webPlayableResultAudioExtension + "\"";
		console.log(new Date() + " " + localFileDetails.fileBaseName + " Generating web playable audio result...");

		shellPromises.execute(audioResultCommand)
			.then(function(results) {
				console.log("Created web playable audio results: ");
				console.log(results);
				localFileDetails.webResultStatus = 200;
				fs.renameSync(localFileDetails.currentWorkingDir + "/" + localFileDetails.fileBaseName + webPlayableResultAudioExtension, localRawDir + "/" + localFileDetails.uploadFileId + webPlayableResultAudioExtension);
				localFileDetails.webResultInfo = updateSymlink(localRawDir + "/" + localFileDetails.uploadFileId + webPlayableResultAudioExtension,
					localFileDetails.currentWorkingDir + "/" + localFileDetails.fileBaseName + webPlayableResultAudioExtension);
			})
			.fail(function(reason) {
				console.log("fail to generate web playable audio result");
				localFileDetails.webResultStatus = 500;
				localFileDetails.webResultInfo = reason;
				console.log(reason);
			});
	}
};
exports.createAudioFromUpload = function(filesWithDetails, dbname, rawDir, destinationDir) {
	var deferred,
		currentWorkingDir,
		fileBaseName,
		resultDetails,
		audioResultCommand,
		promises = [];

	resultDetails = JSON.parse(JSON.stringify(filesWithDetails));

	deferred = Q.defer();
	process.nextTick(function() {
		for (var fileindex = 0; fileindex < resultDetails.length; fileindex++) {

			resultDetails[fileindex].name = resultDetails[fileindex].name.replace(/ /g, "_");
			// console.log(resultDetails[fileindex]);
			fileBaseName = resultDetails[fileindex].name.substring(0, resultDetails[fileindex].name.lastIndexOf("."));
			fileBaseName = fileBaseName.replace(/[ .\[\]\(\)"']/g, "_");
			currentWorkingDir = destinationDir + "/" + dbname + "/" + fileBaseName;
			resultDetails[fileindex].currentWorkingDir = currentWorkingDir;
			resultDetails[fileindex].fileBaseName = fileBaseName;
			// Typical mp4 movie is 1250782156. If audio larger than 500MB, use the long audio script so that the server doesnt run out of memory.
			if (resultDetails[fileindex].size > 525000000) {
				resultDetails[fileindex].praatAudioExtension = ".wav";
				resultDetails[fileindex].script = "LongSound";
			} else {
				resultDetails[fileindex].praatAudioExtension = ".mp3";
				resultDetails[fileindex].script = "Syllables";
			}
			resultDetails[fileindex].dbname = dbname;
			(function(fileDetails, boundindex) {
				var individualDeferred = Q.defer();
				promises.push(individualDeferred.promise);

				checksum.file(fileDetails.path, function(error, checksumResults) {
					if (error) {
						console.log(error);
						individualDeferred.reject(error);
						return;
					}
					fileDetails.uploadFileId = checksumResults;
					console.log(new Date() + " uploadFileId " + fileDetails.uploadFileId);

					fileDetails.checksum = checksumResults;

					try {
						mkdirp.sync(rawDir, function(data) {
							console.log(new Date() + " mkdir callback " + data);
						});
					} catch (e) {
						if (e.errno !== 47) {
							console.log(e);
						} else {
							console.log(new Date() + " Dir was already ready.");
						}
					}

					try {
						mkdirp.sync(fileDetails.currentWorkingDir, function(data) {
							console.log(new Date() + " mkdir callback " + data);
						});
					} catch (e) {
						if (e.errno !== 47) {
							console.log(e);
						} else {
							console.log(new Date() + " Dir was already ready.");
						}
					}

					if (fs.existsSync(rawDir + "/" + fileDetails.uploadFileId)) {
						fileDetails.uploadInfo = "Exists";
						fileDetails.uploadStatus = 304;
					} else {
						fs.renameSync(fileDetails.path, rawDir + "/" + fileDetails.uploadFileId, function(data) {
							console.log(new Date() + " renameSync callback " + data);
						});
					}

					//create sym link to checksum to permit multiple files in the corpus to be the same file and not consume extra disk space
					fileDetails.uploadInfo = updateSymlink(rawDir + "/" + fileDetails.uploadFileId,
						fileDetails.currentWorkingDir + "/" + fileDetails.name);
					console.log(new Date() + " " + fileDetails.fileBaseName + " Original: " + fileDetails.uploadInfo);

					// If this uploaded file has had a audio result already made from it, don't regenerate it.
					console.log(new Date() + " " + fileDetails.fileBaseName + " Verifying audio result.");
					var audioResultExists = fs.existsSync(rawDir + "/" + fileDetails.uploadFileId + fileDetails.praatAudioExtension);
					var audioResultIsNotEmpty = {
						size: 0
					};
					if (audioResultExists) {
						audioResultIsNotEmpty = fs.statSync(rawDir + "/" + fileDetails.uploadFileId + fileDetails.praatAudioExtension);
					}
					console.log("audioResultIsNotEmpty");
					console.log(audioResultIsNotEmpty);
					if (audioResultExists && audioResultIsNotEmpty.size > 10) {
						console.log(new Date() + " " + fileDetails.fileBaseName + " This audio/video file already had a corresponding audio result, not regenerating it");
						fileDetails.resultStatus = 304;
						fileDetails.resultInfo = updateSymlink(rawDir + "/" + fileDetails.uploadFileId + fileDetails.praatAudioExtension,
							fileDetails.currentWorkingDir + "/" + fileDetails.fileBaseName + fileDetails.praatAudioExtension);
						generateTextGrid(fileDetails, rawDir, individualDeferred);
					} else {
						audioResultCommand = "ffmpeg -y -i \"" + fileDetails.currentWorkingDir + "/" + fileDetails.name +
							"\" -ac 1 -ar 22050 \"" + rawDir + "/" + fileDetails.uploadFileId + fileDetails.praatAudioExtension + "\"";
						console.log(new Date() + " " + fileDetails.fileBaseName + " Generating audio result...");

						shellPromises.execute(audioResultCommand)
							.then(function(results) {
								console.log("Create audio results: ");
								console.log(results);
								fileDetails.resultStatus = 200;
								// fs.renameSync(rawDir + "/" + fileDetails.uploadFileId + fileDetails.praatAudioExtension, fileDetails.currentWorkingDir + "/" + fileDetails.fileBaseName + fileDetails.praatAudioExtension);
								fileDetails.resultInfo = updateSymlink(rawDir + "/" + fileDetails.uploadFileId + fileDetails.praatAudioExtension,
									fileDetails.currentWorkingDir + "/" + fileDetails.fileBaseName + fileDetails.praatAudioExtension);
								generateTextGrid(fileDetails, rawDir, individualDeferred);
							})
							.fail(function(reason) {
								console.log("failed to generate audio result");
								fileDetails.resultInfo = reason;
								if (reason.indexOf("does not contain any audio stream")) {
									fileDetails.resultStatus = 422;
									fileDetails.textGridStatus = 422;
									fileDetails.textGridInfo = "File “" + fileDetails.name + "” contains no audio data. You can import any audio/video file which contains an audio track. Are you sure this file has an audio track?";
								} else {
									fileDetails.resultStatus = 500;
									fileDetails.textGridStatus = 500;
									fileDetails.textGridInfo = "File “" + fileDetails.name + "” was not processed due to an earlier error in the audio conversion process.";
								}
								individualDeferred.reject(reason);
							});
					}

				});

			})(resultDetails[fileindex], fileindex);

		}
		process.nextTick(function() {
			console.log(new Date() + " promises" + promises.length);
			if (promises.length === 0) {
				deferred.resolve(resultDetails);
			} else {
				Q.allSettled(promises)
					.then(function(results) {
						results.forEach(function(result) {
							if (result.state === "fulfilled") {
								var value = result.value;
								// console.log(value);
							} else {
								var reason = result.reason;
								// console.log(result);
							}

						});
						deferred.resolve(resultDetails);
					});
			}
		});


	});
	return deferred.promise;
};
