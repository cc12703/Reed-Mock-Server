




var build = function(params, query, body, options) {


	body = {
		test: "test"
	}	

	return {
		__status__: 400,
		__body__: body
	}
}


module.exports.build = build