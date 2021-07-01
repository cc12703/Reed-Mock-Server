
const SIO = require('socket.io'),
		log = require('debug')('SocketIO'),
		fs = require('fs'),
		dummyJson = require('@cc12703m/dummy-json'),
		Config = require('../config'),
		{ absPath } = require('../util')




module.exports = (app) => {

	const oldListen = app.listen

	app.listen = (...args) => {

		app.server = oldListen.apply(app, args)

		sio = SIO(app.server, {
			cors: {credentials: true},
			path: Config.serveSocketIO.endpoint})
		
		setConnections(sio)
		app.server.on('close', () => sio.close() )

		return app.server
	}

}

function setConnections(serverIO) {
	const { namespaces } = Config.serveSocketIO

	namespaces.filter(nsp => nsp.filePath).forEach(nsp => {
		serverIO.of(nsp.namespace)
				.on('connection', socket => onConnection(socket, templateHandler(nsp)))
	});
}

function onConnection(socket, handleFn) {
	log(`Connection received: ${socket.id}`)

	socket.on('error', e => log(`Connection Error: ${e.message}`))
	socket.on('close', ()=> log('Connection close'))

	handleFn(socket)
		.catch(e => log(`Connection Handle Error: ${e.message}`))

}




function templateHandler(nspConfig) {
    const { namespace, type, event, filePath, interval } = nspConfig;
    return async socket => {

        log(`Middleware applied for ${namespace}`)

        socket.on('message', msg => log(`Info On message: \r\n${msg}`))

        let sendMsg = () => {
            log(`[${new Date().format('yyyy-MM-dd hh:mm:ss.S')}] Sending message for ${event? event : 'message'}`)
            if(event) {
                socket.emit(event, generateJson(filePath))
            }
            else {
                socket.send(generateJson(filePath))
            }
        }

        if (type == 'timer') {
            let timer = setInterval(sendMsg, Number(interval))
            socket.on('close', () => clearInterval(timer))

        } else if (type == 'fileWatcher') {
            let file = absPath(filePath)
            fs.watchFile(file, sendMsg)

            socket.on('close', () => {
				fs.unwatchFile(file, sendMsg)
			})
        }
    }
}


function generateJson(filePath) {
    const template = fs.readFileSync(absPath(filePath)).toString(),
        jsonStr = dummyJson.parse(template)
		log(jsonStr)
    return jsonStr
}