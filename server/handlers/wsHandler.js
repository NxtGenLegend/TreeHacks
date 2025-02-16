const WebSocket = require("ws");
const WebSocketUtils = require('../utils/wsUtils');
const SignalingHandler = require('./signalingHandler');
const MediaHandler = require('./mediaHandler');

class WSHandler {
    static setupWebSocketServer(server) {
        const wss = new WebSocket.Server({
            noServer: true,
            clientTracking: true,
        });

        // Create a separate WebSocket server for logs
        const logsWss = new WebSocket.Server({
            noServer: true,
            clientTracking: true,
        });

        // Store logs server in global scope
        global.logsWss = logsWss;

        wss.on("connection", this.handleConnection);
        wss.on("error", this.handleError);
        wss.on("close", this.handleClose);

        logsWss.on("connection", (ws) => {
            console.log("New logs connection established");
            ws.isLogsConnection = true;
        });

        // Setup periodic connection check
        setInterval(() => {
            wss.clients.forEach(ws => {
                if (!ws.isAlive) {
                    ws.missedKeepAlives = (ws.missedKeepAlives || 0) + 1;
                    
                    // Terminate connection after 3 missed keep-alives (15 seconds)
                    if (ws.missedKeepAlives >= 3) {
                        console.log("Terminating connection due to missed keep-alives");
                        return ws.terminate();
                    }
                }

                ws.isAlive = false;
                ws.send(JSON.stringify({
                    msg_type: "KEEP_ALIVE_REQ",
                    timestamp: Date.now()
                }));
            });
        }, 5000);

        return wss;
    }

    static handleUpgrade(request, socket, head) {
        WebSocketUtils.handleSocketError(socket);
        console.log("Upgrade request received for:", request.url);

        if (request.url === "/logs") {
            console.log("Handling logs upgrade");
            global.logsWss.handleUpgrade(request, socket, head, (ws) => {
                global.logsWss.emit("connection", ws, request);
            });
        } else if (request.url === "/signaling") {
            console.log("Handling signaling upgrade");
            SignalingHandler.emitSignalingLog('Info', 'Signaling Upgrade Request', { path: request.url });
            global.wss.handleUpgrade(request, socket, head, (ws) => {
                global.wss.emit("connection", ws, request);
            });
        } else if (this.isMediaPath(request.url)) {
            console.log("Handling media upgrade for:", request.url);
            if (global.mediaServer) {
                global.mediaServer.handleUpgrade(request, socket, head, (ws) => {
                    global.mediaServer.emit("connection", ws, request);
                });
            } else {
                console.log("No media server available");
                socket.destroy();
            }
        } else if (request.url === "/" || request.url === "") {
            global.wss.handleUpgrade(request, socket, head, (ws) => {
                global.wss.emit("connection", ws, request);
            });
        } else {
            console.log("Invalid WebSocket path:", request.url);
            socket.destroy();
        }
    }

    static isMediaPath(url) {
        return url.startsWith("/audio") ||
               url.startsWith("/video") ||
               url.startsWith("/transcript") ||
               url.startsWith("/all");
    }

    static handleConnection(ws) {
        console.log("New handshake connection established");
        global.signalingWebsocket = ws;

        // Initialize connection state
        ws.isAlive = true;
        ws.missedKeepAlives = 0;
        ws.lastKeepAliveResponse = Date.now();

        // Send signaling connection log
        SignalingHandler.emitSignalingLog('Success', 'Signaling Connection Established');

        ws.on("close", () => {
            SignalingHandler.emitSignalingLog('Event', 'Signaling Connection Closed');
            SignalingHandler.handleClose();
        });
        
        ws.on("error", (error) => {
            SignalingHandler.emitSignalingLog('Error', 'Signaling Connection Error', { error: error?.message });
            SignalingHandler.handleError(error);
        });
        
        ws.on("message", (data) => {
            SignalingHandler.handleMessage(ws, data);
        });
        
        ws.on("pong", () => {
            ws.isAlive = true;
            ws.missedKeepAlives = 0;
        });
    }

    static handleError(error) {
        console.error("WebSocket server error:", error);
        global.isHandshakeServerActive = false;
        MediaHandler.closeMediaServer();
    }

    static handleClose() {
        console.log("Handshake server closed");
        global.isHandshakeServerActive = false;
        MediaHandler.closeMediaServer();
    }

    static async handleReconnection(ws, message) {
        const { meeting_uuid, rtms_stream_id } = message;
        
        // Check if session exists
        const existingSession = this.sessions.get(`${meeting_uuid}:${rtms_stream_id}`);
        if (!existingSession) {
            WebSocketUtils.sendWebSocketResponse(ws, "RECONNECT_RESP", "STATUS_SESSION_NOT_FOUND");
            return;
        }

        // Handle reconnection
        if (existingSession.isReconnecting) {
            WebSocketUtils.sendWebSocketResponse(ws, "RECONNECT_RESP", "STATUS_DUPLICATE_CONNECTION");
            ws.close();
            return;
        }

        existingSession.isReconnecting = true;
        
    }
}

module.exports = WSHandler; 