

const Config = require('../config'),
	fs = require('fs'),
	Router = require('koa-router'),
	path = require('path'),
 	compose = require('koa-compose'),
	dummyJson = require('@cc12703m/dummy-json'),
 	{ normalizePrefix, absPath } = require('../util')


module.exports = () => {

	const rules = Config.servePath.endpoints,
		mws = rules.map(({ endpoint, type, filePath, partial, options }) => {
		endpoint = normalizePrefix(endpoint)
		if (filePath) {
			filePath = absPath(filePath)

			const router = new Router()
			if(type === 'get') {
				router.get(endpoint, buildGetHandle(filePath, partial, options))
			}

			return router.routes()
		}
		
		}).filter(s=> !!s)

	return compose(mws)
}


function buildGetHandle(filePath, partial, options) {
	return async (ctx, next) => {
		const inMockdata = new Object()
		for (key in ctx.params) {
			inMockdata['arg_' + key] = ctx.params[key]
		}

		const inPartials = new Object()
		if(partial) {
			for (key in partial) {
				const val = partial[key]
				if(typeof(val) === 'string') {
					inPartials[key] = fs.readFileSync(val).toString()
				}
			}	
		}
		
		const dummyOptions = buildDummyOptions(options, inMockdata, inPartials)	
		setResult(ctx, loadResponse(filePath, dummyOptions))
	}	
}

function buildDummyOptions(options, inMockdata, inPartials) {
	if(!options) {
		const dummyOptions = new Object()
		dummyOptions.mockdata = inMockdata
		dummyOptions.partials = inPartials
		return dummyOptions
	}
		
	const outMockdata = ('mockdata' in options)? options['mockdata'] : {}
	options['mockdata'] = Object.assign(outMockdata, inMockdata)

	const outPartials = ('partials' in options)? options['partials'] : {}
	options['partials'] = Object.assign(outPartials, inPartials)
	
	return options
}


function loadResponse(filePath, dummyOptions) {
	const source = fs.readFileSync(filePath).toString()
    let jsonData = ''
    if (path.extname(filePath).toLowerCase() == '.json') {
        jsonData = JSON.parse(source)
    } else {
        let jsonResult = dummyJson.parse(source, dummyOptions)
        jsonData = JSON.parse(jsonResult)
    }
	return jsonData
}

function setResult(ctx, result) {
    ctx.type = 'json'
    ctx.status = result ? 200 : 404
    ctx.body = result || { error: `Not Found: ${ctx.path}` }
}