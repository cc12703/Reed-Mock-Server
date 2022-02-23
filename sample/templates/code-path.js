




var build = function(params, query, options) {


	data = {
		test: "test"
	}	

	return Object.assign(data, params, query)
}


module.exports.build = build