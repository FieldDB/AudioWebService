var Q = require("q");
var shellPromises = require("./shellPromises");
var node_config = require("./nodeconfig_local");

var TextGrid = function TextGrid(options) {
	this.audioFile = options ? options.audioFile : "";
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
				var starting_time = 0;
				var finishing_time = 0;
				var minimum_duration = 0.6;
				var maximum_intensity = 59;
				var minimum_pitch = 100;
				var time_step = 0;
				var window_size = 20;
				var boundary_placement = "\"Two boundaries with a time margin of:\"";//2;
				// button One boundary at the center of each pause
				// button Two boundaries with a time margin of:
				var margin = 0.1;
				var mark_pause_intervals_with_xxx = 0;

				textGridCommand = node_config.praatCommand + __dirname.replace(/lib$/g, "") 
				+ "node_modules/praat-scripts/mark_pauses.praat " + starting_time + " " 
				+ finishing_time + " " + minimum_duration + " " + maximum_intensity + " " 
				+ minimum_pitch + " " + time_step + " " + window_size + " " + boundary_placement 
				+ " " + margin + " " + mark_pause_intervals_with_xxx + " \"" + self.workingDir 
				+ "\"/  \"" + self.workingDir + "\"   \"" + self.audioFile + "\""; //+ " 2>&1 ";
				// console.log("In the generate" + textGridCommand);
				shellPromises.execute(textGridCommand)
					.then(function(textgridResults) {
						console.log("textgridResults");
						console.log(textgridResults);
						try {
							textgridResults = JSON.parse(textgridResults.trim());
							// console.log("TextGrid returned an object");
						} catch (e) {
							console.log(new Date() + " TextGrid did not return an object" + textgridResults);
							console.log(e);
						}
						textgridResults.minimum_duration = minimum_duration;
						textgridResults.maximum_intensity = maximum_intensity;
						textgridResults.minimum_pitch = minimum_pitch;
						textgridResults.time_step = time_step;
						textgridResults.window_size = window_size;
						textgridResults.margin = margin;

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
