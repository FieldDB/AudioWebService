var Q = require("q");
var childProcess = require('child_process');
var serverInternalPath = new RegExp(__dirname.replace(/lib$/, "") + "[^.]*/", "g");

exports.execute = function(command) {
	var deferred,
		localProcess;

	console.log(command);
	deferred = Q.defer();
	console.log(new Date() + " PATH" , process.env.PATH);

	localProcess = childProcess.exec(command, function(error, stdout, stderr) {
		// console.log("in result childProcess");
		if (error !== null) {
			if (command.indexOf("avconv") > -1) {
				var commandPieces = command.split(" ");
				if (stderr.indexOf("does not contain any stream")) {
					console.log("rejecting FFMpeg error does not contain any audio stream");
					deferred.reject("File does not contain any audio stream");
				} else {
					deferred.resolve(stderr);
				}
			} else {
				console.log("");
				console.log("");
				console.log("");
				console.log("");
				console.log("rejecting childProcess error");
				console.log(error);
				deferred.reject(error.message.replace(serverInternalPath, ""));
			}
		} else {
			console.log("resolving childProcess stdout");
			deferred.resolve(stdout);
		}
	});

	return deferred.promise;
};
