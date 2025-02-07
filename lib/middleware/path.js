

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
				router.get(endpoint, buildHandle(filePath, partial, options))
			}
			else if(type === 'post') {
				router.post(endpoint, buildHandle(filePath, partial, options))
			}
			else if(type == 'put') {
				router.put(endpoint, buildHandle(filePath, partial, options))
			}
			else if(type == 'delete') {
				router.delete(endpoint, buildHandle(filePath, partial, options))
			}

			return router.routes()
		}
		
		}).filter(s=> !!s)

	return compose(mws)
}


function buildHandle(filePath, partial, options) {
	return async (ctx, next) => {
		
		if(path.extname(filePath).toLowerCase() == '.js') {
			mod = require(filePath)
			data = mod.build(ctx.params, ctx.request.query, ctx.request.body, options)
			setResult(ctx, data)
			return
		}

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
		setResultOfBody(ctx, loadResponse(filePath, dummyOptions))
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

function setResultOfBody(ctx, result) {
    ctx.type = 'json'
    ctx.status = result ? 200 : 404
    ctx.body = result || { error: `Not Found: ${ctx.path}` }
}


function setResult(ctx, data) {
	ctx.type = 'json'

	if (data) {
		ctx.status = data['__status__']
		ctx.body = data['__body__']
	}
	else {
		ctx.status = 500
		ctx.body = { error: `Not Found: ${ctx.path}` }
	}
}