const path = require('path'),
    Config = require('../config'),
    compose = require('koa-compose'),
    { normalizePrefix, absPath } = require('../util'),
    jsonApi = require('@cc12703m/reed-json-api')

module.exports = () => {

    const rules = Config.serveApi.endpoints,
        mws = rules.map(({ endpoint, scriptPath, filePath, options }) => {
            endpoint = normalizePrefix(endpoint)
            if (filePath) {
                filePath = absPath(filePath);
                return jsonApi({ urlPrefix: endpoint, filePath, options })
            }

            if (scriptPath) {
                scriptPath = absPath(scriptPath);
                return require(scriptPath)({ urlPrefix: endpoint, options });
            }
        }).filter(s=> !!s)

    return compose(mws)
}