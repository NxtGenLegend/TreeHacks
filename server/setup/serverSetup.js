const WebSocket = require("ws");
const express = require("express");
const http = require("http");
const CONFIG = require('../config/serverConfig');
const WebSocketUtils = require('../utils/wsUtils');
const path = require("path");
const webhookRouter = require("../handlers/webhookHandler");
const multer = require('multer');

class ServerSetup {
    static setupHandshakeServer() {
        const app = express();
        const server = http.createServer(app);
        
        // Add middleware
        app.use(express.json());
        app.use(express.static("public"));

        // Basic routes
        app.get("/", (req, res) => {
            res.sendFile(path.join(__dirname, "../../public", "index.html"));
        });

        // Health check endpoints
        app.get("/health", (req, res) => res.status(200).send("OK"));
        app.get("/ws-health", (req, res) => {
            if (global.isHandshakeServerActive && global.mediaServer) {
                res.status(200).json({ status: "ok" });
            } else {
                res.status(503).json({
                    status: "error",
                    message: "WebSocket servers not ready",
                });
            }
        });

        // Add webhook routes
        app.use("/api", webhookRouter);

        server.listen(CONFIG.HANDSHAKE_PORT, CONFIG.HOST, () => {
            console.log(`Handshake server running on ${CONFIG.HOST}:${CONFIG.HANDSHAKE_PORT}`);
        });

        return server;
    }

    static setupMediaServer() {
        const app = express();
        const server = http.createServer(app);
        
        server.listen(CONFIG.MEDIA_PORT, CONFIG.HOST, () => {
            console.log(`Media server running on ${CONFIG.HOST}:${CONFIG.MEDIA_PORT}`);
        });

        return server;
    }
}

module.exports = ServerSetup; 