const exitHook = require('async-exit-hook');
const RammerheadProxy = require('../classes/RammerheadProxy');
const addStaticDirToProxy = require('../util/addStaticDirToProxy');
const RammerheadSessionFileCache = require('../classes/RammerheadSessionFileCache');
const config = require('../config');
const setupRoutes = require('./setupRoutes');
const setupPipeline = require('./setupPipeline');
const RammerheadLogging = require('../classes/RammerheadLogging');

const logger = new RammerheadLogging({
    logLevel: config.logLevel,
    generatePrefix: (level) => `[${new Date().toISOString()}] [${level.toUpperCase()}] `
});

const proxyServer = new RammerheadProxy({
    logger,
    loggerGetIP: config.getIP,
    bindingAddress: '0.0.0.0',
    port: process.env.PORT || 8080,
    dontListen: false,
    ssl: config.ssl,
    getServerInfo: config.getServerInfo,
    disableLocalStorageSync: config.disableLocalStorageSync,
    jsCache: config.jsCache,
    disableHttp2: config.disableHttp2
});

if (config.publicDir) addStaticDirToProxy(proxyServer, config.publicDir);

const sessionStore = new RammerheadSessionFileCache({
    logger,
    ...config.fileCacheSessionConfig,
    staleCleanupOptions: null
});
sessionStore.attachToProxy(proxyServer);

setupPipeline(proxyServer, sessionStore);
setupRoutes(proxyServer, sessionStore, logger);

exitHook(() => {
    logger.info('Received exit signal, closing proxy server');
    proxyServer.close();
    logger.info('Closed proxy server');
});

module.exports = proxyServer;