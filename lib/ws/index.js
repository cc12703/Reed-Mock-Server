// const Config = require('../config')
const Router = require('koa-router'),
    KoaWs = require('reed-koa-websocket'),
    fs = require('fs'),
    path = require('path'),
    dummyJson = require('@cc12703m/dummy-json'),
    Config = require('../config'),
    { absPath } = require('../util')


const logPrefix = '[Reed Mock] [WebSocket] '

module.exports = app => {
    app.ws = new KoaWs(app)
    app.ws.use(getRouters())
}

function getRouters() {

    const { endpoints } = Config.serveWebsocket,
        router = new Router()

    endpoints.filter(s => s.filePath).forEach(s => router.all(s.endpoint, templateHandler(s)));
    endpoints.filter(s => s.scriptPath).forEach(s => router.all(s.endpoint, customHandler(s)));

    return router.routes()
}

function customHandler(wsConfig) {
    const { scriptPath } = wsConfig,
        absScript = absScript(scriptPath)

    return require(absPath);
}

function templateHandler(wsConfig) {
    const { endpoint, type, event, filePath, interval } = wsConfig;
    return async ctx => {

        console.log(`${logPrefix}Middleware applied for ${endpoint}`)

        ctx.websocket.on('message', msg => console.log(`${logPrefix}Info On message: \r\n${msg}`))

        let sendMsg = () => {
            console.log(`${logPrefix}[${new Date().format('yyyy-MM-dd hh:mm:ss.S')}] Sending message for ${event? event : 'message'}`)
            if(event) {
                ctx.websocket.emit(event, generateJson(filePath))
            }
            else {
                ctx.websocket.send(generateJson(filePath))
            }
        }

        if (type == 'timer') {

            let timer = setInterval(sendMsg, Number(interval))
            ctx.websocket.on('close', () => clearInterval(timer))

        } else if (type == 'fileWatcher') {

            let file = absPath(filePath)
            fs.watchFile(file, sendMsg)
            ctx.websocket.on('close', () => fs.unwatchFile(file, sendMsg))
        }
    }
}


function generateJson(filePath) {
    let jsonStr = ''

    if(path.extname(filePath).toLowerCase() == '.js') {
        let file = absPath(filePath)
        mod = require(file)
		jsonStr = JSON.stringify(mod.build())
    }
    else {
        const template = fs.readFileSync(absPath(filePath)).toString()
        jsonStr = dummyJson.parse(template)
    }
    
    return jsonStr
}
