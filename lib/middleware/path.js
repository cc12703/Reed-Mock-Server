

const Config = require('../config'),
	fs = require('fs'),
	Router = require('koa-router'),
	path = require('path'),
 	compose = require('koa-compose'),
	dummyJson = require('dummy-json'),
 	{ normalizePrefix, absPath } = require('../util')


module.exports = () => {

	const rules = Config.servePath.endpoints,
		mws = rules.map(({ endpoint, type, filePath, options }) => {
		endpoint = normalizePrefix(endpoint)
		if (filePath) {
			filePath = absPath(filePath)

			const router = new Router()
			if(type === 'get') {
				router.get(endpoint, buildGetHandle(filePath, options))
			}

			return router.routes()
		}
		
		}).filter(s=> !!s)

	return compose(mws)
}


function buildGetHandle(filePath, options) {
	return async (ctx, next) => {
		const argMockdata = new Object()
		for (key in ctx.params) {
			argMockdata['arg_' + key] = ctx.params[key]
		}
		
		const dummyOptions = buildDummyOptions(options, argMockdata)	
		setResult(ctx, loadResponse(filePath, dummyOptions))
	}	
}

function buildDummyOptions(options, argMockData) {
	if(!options) {
		const dummyOptions = new Object()
		dummyOptions.mockdata = argMockData
		return dummyOptions
	}
		

	if('mockdata' in options) {
		const origin = options['mockdata']
		options['mockdata'] = Object.assign(origin, argMockData)
	}
	else {
		options['mockdata'] = argMockData
	}
	
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