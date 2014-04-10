var Q = require("q");
var childProcess = require('child_process');

exports.execute = function(command) {
	var deferred,
		process;
	console.log(command);
	deferred = Q.defer()
	process = childProcess.exec(command, function(error, stdout, stderr) {
		if (error !== null) {
			if (command.indexOf("ffmpeg") > -1) {
				console.log("resolving stderr");
				deferred.resolve(stderr);
			} else {
				console.log("rejecting error");
				deferred.reject(error);
			}
		} else {
			console.log("resolving stdout");
			deferred.resolve(stdout);
		}
	});

	return deferred.promise;
};
