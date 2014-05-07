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
		currentWorkingDir,
		fileBaseName,
		resultDetails,
		wavCommand,
		promises = [];

	resultDetails = JSON.parse(JSON.stringify(filesWithDetails));

	deferred = Q.defer();
	process.nextTick(function() {
		for (var fileindex = 0; fileindex < resultDetails.length; fileindex++) {
			resultDetails[fileindex].name = resultDetails[fileindex].name.replace(/ /g, "_");
			// console.log(resultDetails[fileindex]);
			fileBaseName = resultDetails[fileindex].name.substring(0, resultDetails[fileindex].name.lastIndexOf("."));
			fileBaseName = fileBaseName.replace(/ /g, "_");
			currentWorkingDir = destinationDir + "/" + dbname + "/" + fileBaseName;
			resultDetails[fileindex].currentWorkingDir = currentWorkingDir;
			resultDetails[fileindex].fileBaseName = fileBaseName;
			resultDetails[fileindex].dbname = dbname;
			(function(fileDetails, boundindex) {
				var individualDeferred = Q.defer();
				promises.push(individualDeferred.promise);

				checksum.file(fileDetails.path, function(error, checksumResults) {
					if (error) {
						console.log(reason);
						individualDeferred.reject(reason);
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

					// If this uploaded file has had a wav already made from it, don't regenerate it.
					console.log(new Date() + " " + fileDetails.fileBaseName + " Verifying wav.");
					if (fs.existsSync(rawDir + "/" + fileDetails.uploadFileId + ".wav")) {
						console.log(new Date() + " " + fileDetails.fileBaseName + " This audio/video file already had a corresponding wav, not regenerating it");
						fileDetails.wavStatus = 304;
						fileDetails.wavInfo = updateSymlink(rawDir + "/" + fileDetails.uploadFileId + ".wav",
							fileDetails.currentWorkingDir + "/" + fileDetails.fileBaseName + ".wav");
						console.log(new Date() + " " + fileDetails.fileBaseName + " Wav: " + fileDetails.wavInfo);
						new TextGrid({
							workingDir: fileDetails.currentWorkingDir,
							wavFile: fileDetails.fileBaseName + ".wav"
						}).generate()
							.then(function(textGridResults) {
								console.log(new Date() + " " + fileDetails.fileBaseName + " TextGrid completed ");
								fileDetails.syllablesAndUtterances = textGridResults;
								fileDetails.textGridInfo = "regenerated";
								fileDetails.textGridStatus = 200;
								fs.renameSync(fileDetails.currentWorkingDir + "/" + fileDetails.fileBaseName + ".wav.TextGrid", fileDetails.currentWorkingDir + "/" + fileDetails.fileBaseName + ".TextGrid");
								individualDeferred.resolve(fileDetails);
							})
							.fail(function(reason) {
								console.log("fail generate textgrid based on new wav");
								if (reason.indexOf("ontains no audio data.") > -1) {
									reason = "File “" + fileDetails.name + "” contains no audio data. You can import any audio/video file which contains an audio track. Are you sure this file has an audio track?";
									fileDetails.textGridStatus = 422;
								} else {
									fileDetails.textGridStatus = 500;
								}
								fileDetails.textGridInfo = reason;
								console.log(fileDetails);
								individualDeferred.reject(reason);
							});
					} else {
						wavCommand = "ffmpeg -y -i \"" + fileDetails.currentWorkingDir + "/" + fileDetails.name +
							"\" \"" + fileDetails.currentWorkingDir + "/" + fileDetails.fileBaseName + ".wav\"";
						console.log(new Date() + " " + fileDetails.fileBaseName + " Generating wav...");

						shellPromises.execute(wavCommand)
							.then(function(results) {
								console.log("Create audio results: ");
								console.log(results);
								fileDetails.wavStatus = 200;
								fs.renameSync(fileDetails.currentWorkingDir + "/" + fileDetails.fileBaseName + ".wav", rawDir + "/" + fileDetails.uploadFileId + ".wav");
								fileDetails.wavInfo = updateSymlink(rawDir + "/" + fileDetails.uploadFileId + ".wav",
									fileDetails.currentWorkingDir + "/" + fileDetails.fileBaseName + ".wav");
								console.log(new Date() + " " + fileDetails.fileBaseName + " Wav: " + fileDetails.wavInfo);
								new TextGrid({
									workingDir: fileDetails.currentWorkingDir,
									wavFile: fileDetails.fileBaseName + ".wav"
								}).generate()
									.then(function(textGridResults) {
										console.log(new Date() + " " + fileDetails.fileBaseName + " TextGrid completed ");
										fileDetails.syllablesAndUtterances = textGridResults;
										fileDetails.textGridInfo = "regenerated";
										fileDetails.textGridStatus = 200;
										fs.renameSync(fileDetails.currentWorkingDir + "/" + fileDetails.fileBaseName + ".wav.TextGrid", fileDetails.currentWorkingDir + "/" + fileDetails.fileBaseName + ".TextGrid");
										individualDeferred.resolve(fileDetails);
									})
									.fail(function(reason) {
										console.log("fail generate textgrid based on new wav");
										if (reason.indexOf("ontains no audio data.") > -1) {
											reason = "File “" + fileDetails.name + "” contains no audio data. You can import any audio/video file which contains an audio track. Are you sure this file has an audio track?";
											fileDetails.textGridStatus = 422;
										} else {
											fileDetails.textGridStatus = 500;
										}
										fileDetails.textGridInfo = reason;
										console.log(fileDetails);
										individualDeferred.reject(reason);
									});
							})
							.fail(function(reason) {
								console.log("fail to generate wav");
								fileDetails.wavStatus = 200;
								fileDetails.wavInfo = reason;
								console.log(reason);
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
								console.log(value);
							} else {
								var reason = result.reason;
								console.log(result);
							}
						});
						deferred.resolve(resultDetails);
					});
			}
		});


	});
	return deferred.promise;
};
