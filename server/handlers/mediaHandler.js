const WebSocket = require("ws");
const WebSocketUtils = require('../utils/wsUtils');
const CONFIG = require('../config/serverConfig');
const SignalingHandler = require('./signalingHandler');

class MediaHandler {
    static setupMediaServer(httpServer) {
        const mediaServer = new WebSocket.Server({
            server: httpServer,
            host: CONFIG.HOST
        });

        this.setupMediaWebSocketHandlers(mediaServer);
        return mediaServer;
    }

    static setupMediaWebSocketHandlers(mediaServer) {
        mediaServer.on("connection", (ws, req) => {
            console.log("Media server connection established");
            ws.rtmsSessionId = WebSocketUtils.generateSequence();
            ws.pathname = req.url;
            
            console.log(`Client connected to media channel: ${req.url}`);

            // Store streams for this connection
            ws.mediaStreams = {
                audio: null,
                video: null
            };

            // Use arrow function to preserve 'this' context
            ws.on("message", (data) => this.handleMediaMessage(data, ws));
            ws.on("close", () => this.handleMediaClose(ws));
            ws.on("error", (error) => this.handleMediaError(ws, error));
        });
    }

    static handleMediaMessage(data, ws) {
        try {
            const message = JSON.parse(data);
            
            // Handle debug logs
            if (message.msg_type === "DEBUG_LOG") {
                console.log("DEBUG:", message.content.message);
                return;
            }

            console.log("Received message on media channel:", message.msg_type);

            if (message.msg_type === "MEDIA_DATA_AUDIO") {
                console.log("Received audio data, length:", message.content.data.length);
            }

            if (message.msg_type === "SESSION_STATE_UPDATE" && 
                global.signalingWebsocket?.readyState === WebSocket.OPEN) {
                this.handleSessionStateUpdate(message);
            }

            if (MediaHandler.isMediaDataMessage(message)) {
                this.broadcastMediaData(message);
            }
        } catch (error) {
            console.error("Error processing message on media channel:", error);
        }
    }

    static isMediaDataMessage(message) {
        return ["MEDIA_DATA_VIDEO", "MEDIA_DATA_AUDIO", "MEDIA_DATA_TRANSCRIPT"]
            .includes(message.msg_type);
    }

    static handleSessionStateUpdate(message) {
        global.signalingWebsocket.send(JSON.stringify({
            msg_type: "SESSION_STATE_UPDATE",
            session_id: message.rmts_session_id,
            state: message.state,
            stop_reason: message.stop_reason,
            timestamp: Date.now()
        }));

        if (message.state === "STOPPED") {
            this.handleSessionStop();
        }
    }

    static handleSessionStop() {
        if (global.mediaServer) {
            // Get a random stop reason from SignalingHandler
            const stopReason = SignalingHandler.getRandomStopReason();
            
            global.mediaServer.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        msg_type: "STREAM_STATE_UPDATE",
                        state: "TERMINATED",
                        reason: stopReason,
                        timestamp: Date.now()
                    }));
                    client.close();
                }
            });
        }

        if (global.signalingWebsocket?.readyState === WebSocket.OPEN) {
            global.signalingWebsocket.close();
        }
    }

    static broadcastMediaData(message) {
        if (!global.mediaServer) return;

        global.mediaServer.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                const clientPath = client.pathname?.replace('/', '') || 'all';
                if (this.shouldSendToClient(clientPath, message.msg_type)) {
                    client.send(JSON.stringify(message));
                }
            }
        });
    }

    static shouldSendToClient(clientPath, messageType) {
        return clientPath === 'all' ||
            (clientPath === 'audio' && messageType === 'MEDIA_DATA_AUDIO') ||
            (clientPath === 'video' && messageType === 'MEDIA_DATA_VIDEO') ||
            (clientPath === 'transcript' && messageType === 'MEDIA_DATA_TRANSCRIPT');
    }

    static handleMediaClose(ws) {
        console.log("Media connection closed");
        if (ws.mediaStreams) {
            ws.mediaStreams.audio = null;
            ws.mediaStreams.video = null;
        }
    }

    static handleMediaError(ws, error) {
        console.error("Media WebSocket error:", error);
        if (ws.mediaStreams) {
            ws.mediaStreams.audio = null;
            ws.mediaStreams.video = null;
        }
    }

    static closeMediaServer() {
        if (global.mediaServer) {
            // Get a random stop reason from SignalingHandler
            const stopReason = SignalingHandler.getRandomStopReason();
            
            global.mediaServer.clients.forEach(client => {
                try {
                    client.send(JSON.stringify({
                        msg_type: "STREAM_STATE_UPDATE",
                        rtms_stream_id: client.rtmsStreamId,
                        state: "TERMINATED",
                        reason: stopReason,
                        timestamp: Date.now()
                    }));
                    client.close();
                } catch (error) {
                    console.error("Error closing media client:", error);
                }
            });

            global.mediaServer.close(() => {
                console.log("Media server closed");
                global.mediaServer = null;
            });
        }
    }
}

module.exports = MediaHandler; 