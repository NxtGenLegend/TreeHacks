const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CredentialsManager {
    static loadCredentials() {
        try {
            const data = JSON.parse(
                fs.readFileSync(
                    path.join(__dirname, "../../data", "rtms_credentials.json"),
                    "utf8"
                )
            );
            const webhookToken = data.Zoom_Webhook_Secret_Token?.[0]?.token || "";
            return {
                auth_credentials: data.auth_credentials || [],
                stream_meeting_info: data.stream_meeting_info || [],
                webhookToken,
            };
        } catch (error) {
            console.error("Error loading credentials:", error);
            return {
                auth_credentials: [],
                stream_meeting_info: [],
                webhookToken: "",
            };
        }
    }

    static validateSignature(signature, clientId, meetingUuid, rtmsStreamId, clientSecret) {
        const expectedSignature = crypto
            .createHmac("sha256", clientSecret)
            .update(`${clientId},${meetingUuid},${rtmsStreamId}`)
            .digest("hex");
        return signature === expectedSignature;
    }

    static generateSRTPKeys() {
        return {
            audio: crypto.randomBytes(32).toString("hex"),
            video: crypto.randomBytes(32).toString("hex"),
            share: crypto.randomBytes(32).toString("hex"),
        };
    }
}

module.exports = CredentialsManager; 