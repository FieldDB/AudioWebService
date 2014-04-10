var TextGrid = function(options) {
	console.log(options);
};

TextGrid.prototype = Object.create(Object.prototype, {
	constructor: {
		value: TextGrid
	},

	generate: {
		value: function() {
			console.log("In the generate");
		}
	}

});
exports.TextGrid = TextGrid;
