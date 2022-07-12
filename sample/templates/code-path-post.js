
var build = function(params, query, body, options) {

	console.log(body)

	data = {}

	return Object.assign(data, params, query)
}


module.exports.build = build