




var build = function(params, query, body, options) {


	data = {
		test: "test"
	}	

	return Object.assign(data, params, query)
}


module.exports.build = build