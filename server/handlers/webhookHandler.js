const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const cors = require('cors');
const https = require('https');
const fetch = require('node-fetch');
const CredentialsManager = require('../utils/credentialsManager');

const router = express.Router();

// Add middleware
router.use(cors());
router.use(express.json());

// Create a custom HTTPS agent that ignores SSL certificate validation
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

// Add webhook validation endpoint
router.post("/validate-webhook", async (req, res) => {
    console.log("Received validation request for webhook URL:", req.body.webhookUrl);
    const { webhookUrl } = req.body;
    const credentials = CredentialsManager.loadCredentials();
    const plainToken = crypto.randomBytes(16).toString("base64");

    try {
        console.log("Attempting to validate webhook at URL:", webhookUrl);
        const validationResponse = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                event: "endpoint.url_validation",
                payload: {
                    plainToken: plainToken,
                },
                event_ts: Date.now(),
            }),
            agent: httpsAgent,
            timeout: 5000
        });

        console.log("Validation response status:", validationResponse.status);

        if (!validationResponse.ok) {
            console.log("Validation failed with status:", validationResponse.status);
            return res.json({
                success: false,
                error: `Webhook endpoint returned error ${validationResponse.status}`,
            });
        }

        const data = await validationResponse.json();
        console.log("Validation response data:", data);

        // Verify the response
        const expectedHash = crypto
            .createHmac("sha256", credentials.webhookToken)
            .update(plainToken)
            .digest("hex");

        if (data.plainToken === plainToken && data.encryptedToken === expectedHash) {
            console.log("Validation successful");
            res.json({ success: true });
        } else {
            console.log("Invalid validation response");
            res.json({ success: false, error: "Invalid validation response" });
        }
    } catch (error) {
        console.error("Validation error:", error);
        res.json({ 
            success: false, 
            error: error.message,
            details: error.cause ? error.cause.message : 'No additional details'
        });
    }
});

router.post("/send-webhook", async (req, res) => {
    const { webhookUrl, isNewMeeting, existingPayload } = req.body;
    
    try {
        let payload;
        if (isNewMeeting || !existingPayload) {
            // Generate new payload for new meetings
            const credentials = CredentialsManager.loadCredentials();
            const credential = getRandomEntry(credentials.auth_credentials);
            const meetingInfo = getRandomEntry(credentials.stream_meeting_info);

            payload = {
                eventType: "meeting.rtms.started",
                eventTime: Date.now(),
                clientId: credential.client_id,
                userId: credential.userID,
                accountId: credential.accountId,
                payload: {
                    event: "meeting.rtms.started",
                    event_ts: Date.now(),
                    payload: {
                        operator_id: credential.userID,
                        object: {
                            meeting_uuid: meetingInfo.meeting_uuid,
                            rtms_stream_id: meetingInfo.rtms_stream_id,
                            server_urls: "ws://0.0.0.0:9092",
                        },
                    },
                },
            };
        } else {
            // Use existing payload for RTMS restart
            payload = existingPayload;
        }

        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            agent: httpsAgent,
            timeout: 5000
        });

        let responseData;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        res.json({
            success: response.ok,
            status: response.status,
            sent: payload,
            response: responseData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.cause ? error.cause.message : 'No additional details',
            attempted_payload: payload,
        });
    }
});

function getRandomEntry(array) {
    return array[Math.floor(Math.random() * array.length)];
}

module.exports = router;
