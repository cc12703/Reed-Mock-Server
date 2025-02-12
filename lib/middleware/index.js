const koaBody = require('koa-body'),
    cors = require('@koa/cors'),
    Config = require('../config'),
    {  absPath } = require('../util'),
    { catchGlobalError, setNotFound, setIndex } = require('./response')

/**
 * @param {Koa} app
 */
function setupMiddleware(app) {
    const hasEndpoint = s => s && s.enabled && s.endpoints && s.endpoints.length
    const hasNamespace = s => s && s.enabled && s.namespaces && s.namespaces.length

    const allowStatic = hasEndpoint(Config.serveStatic),
        allowApi = hasEndpoint(Config.serveApi),
        allowPath = hasEndpoint(Config.servePath),
        allowWs = hasEndpoint(Config.serveWebsocket),
        allowSIO = hasNamespace(Config.serveSocketIO),
        allowProxy = hasEndpoint(Config.serveProxy),
        frontMw = Config.customMiddleware && Config.customMiddleware.front && Config.customMiddleware.front.length,
        lastMw = Config.customMiddleware && Config.customMiddleware.last && Config.customMiddleware.last.length,
        allowCors = Config.cors

    frontMw && Config.customMiddleware.front.forEach(s => app.use(require(absPath(s))))

    app.use(catchGlobalError)

    allowCors && app.use(cors())
    //.use(getKoaLogger('http'))
    allowProxy && app.use(require('../proxy')())
    allowWs && require('../ws')(app)
    allowSIO && require('../sio')(app)
    

    app.use(koaBody())
    allowApi && app.use(require('./api')())
    allowPath && app.use(require('./path')())
    allowStatic && app.use(require('./static')())

    lastMw && Config.customMiddleware.last.forEach(s => app.use(require(absPath(s))))

    app.use(setIndex).use(setNotFound)
}


module.exports = setupMiddleware