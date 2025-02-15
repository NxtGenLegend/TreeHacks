const crypto = require('crypto');

class WebSocketUtils {
    static sendWebSocketResponse(ws, msgType, statusCode, reason = null, additionalData = {}) {
        const response = {
            msg_type: msgType,
            protocol_version: 1,
            status_code: statusCode,
            ...additionalData
        };
        
        if (reason) {
            response.reason = reason;
        }
        
        ws.send(JSON.stringify(response));
    }

    static handleSocketError(socket) {
        socket.on("error", (err) => {
            console.error("Socket error:", err);
        });
    }

    static logWebSocketMessage(direction, type, message, path = "") {
        console.log(
            `[${new Date().toISOString()}] ${direction} ${type} ${path ? `(${path})` : ""}: `,
            typeof message === "string"
                ? message
                : JSON.stringify(message, null, 2),
        );
    }

    static generateSequence() {
        return crypto.randomBytes(16).toString('hex');
    }
}

module.exports = WebSocketUtils; 