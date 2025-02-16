const ServerSetup = require('./server/setup/serverSetup');
const WSHandler = require('./server/handlers/wsHandler');
const MediaHandler = require('./server/handlers/mediaHandler');
const CONFIG = require('./server/config/serverConfig');
const express = require('express');
const webhookRouter = require("./server/handlers/webhookHandler");

// Initialize global state
global.isHandshakeServerActive = false;
global.mediaServer = null;
global.signalingWebsocket = null;
global.wss = null;
global.logsWss = null;

// Setup servers
const handshakeServer = ServerSetup.setupHandshakeServer();
const mediaHttpServer = ServerSetup.setupMediaServer();

// Setup WebSocket servers
global.wss = WSHandler.setupWebSocketServer(handshakeServer);
global.isHandshakeServerActive = true;

// Setup media server
function initializeMediaServer() {
    if (!global.mediaServer || global.mediaServer.isClosed) {
        global.mediaServer = MediaHandler.setupMediaServer(mediaHttpServer);
        console.log("Media server initialized");
    }
    return global.mediaServer;
}

// Initial media server setup
initializeMediaServer();

// Handle WebSocket upgrade requests
handshakeServer.on("upgrade", (request, socket, head) => {
    // Ensure media server is initialized before handling upgrade
    initializeMediaServer();
    WSHandler.handleUpgrade(request, socket, head);
});

// Add webhook router
const app = require('express')();
app.use("/", webhookRouter);

console.log("Starting WSS servers...");