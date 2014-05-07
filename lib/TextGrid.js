var Q = require("q");
var shellPromises = require("./shellPromises");
var node_config = require("./nodeconfig_local");

var TextGrid = function TextGrid(options) {
	this.wavFile = options ? options.wavFile : "";
	this.workingDir = options ? options.workingDir : "";
	Object.call(this);
};
TextGrid.prototype = Object.create(Object.prototype, {
	constructor: {
		value: TextGrid
	},

	generate: {
		value: function() {
			var deferred,
				self;
			deferred = Q.defer();
			self = this;
			process.nextTick(function() {
				textGridCommand = node_config.praatCommand + __dirname.replace(/lib$/g, "") + "praatfiles/praat-script-syllable-nuclei-v2file.praat -20 4 0.4 0.1 no \"" + self.workingDir + "\"   \"" + self.wavFile + "\""; //+ " 2>&1 ";
				// console.log("In the generate" + textGridCommand);
				shellPromises.execute(textGridCommand)
					.then(function(textgridResults) {
						try {
							textgridResults = JSON.parse(textgridResults);
							// console.log("TextGrid returned an object");
						} catch (e) {
							console.log(new Date() + " TextGrid did not return an object");
							console.log(e);
						}
						// console.log(textgridResults);
						this.status = textgridResults;
						deferred.resolve(this.status);
					}, function(reason) {
						console.log(new Date() + " Error generating the textgrid");
						console.log(reason);
						deferred.reject(reason);
					});
			});
			return deferred.promise;
		}
	}

});

exports.TextGrid = TextGrid;
