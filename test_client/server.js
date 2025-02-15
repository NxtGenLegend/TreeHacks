const express = require('express');
const crypto = require('crypto');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = 8000;

// Load environment variable
const BASE_URL = process.env.BASE_URL;

// Middleware to parse incoming JSON payloads
app.use(express.json());

// Configuration - Replace with actual values
const ZOOM_SECRET_TOKEN = 'DyBoLm8OZoJT2Pi3-kY2px'; // Webhook secret for validation
const CLIENT_SECRET = 'YZnKVUufg7N18Oej6gHHqNWc7CG5jQ6N'; // Secret key for generating HMAC signatures

// Add these constants at the top with other constants
const RECORDINGS_DIR = path.join(process.cwd(), 'recordings');
const H264_START_CODE = Buffer.from([0x00, 0x00, 0x00, 0x01]);
const DEFAULT_H264_SPS = Buffer.from([
    0x00, 0x00, 0x00, 0x01, 0x67, 0x42, 0x00, 0x2A,  // Updated SPS with 640x480
    0x95, 0xA8, 0x1E, 0x00, 0x89, 0xF9, 0x50, 0x00,
    0x00, 0x03, 0x00, 0x01, 0x00, 0x00, 0x03, 0x00,
    0x32, 0x8F, 0x16, 0x2E, 0x48
]);
const DEFAULT_H264_PPS = Buffer.from([
    0x00, 0x00, 0x00, 0x01, 0x68, 0xce, 0x06, 0xe2
]);

// Create recordings directory if it doesn't exist
if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR);
}

/**
 * Function to generate HMAC signature
 * 
 * @param {string} clientId - The client ID of the RTMS application
 * @param {string} meetingUuid - The UUID of the Zoom meeting
 * @param {string} streamId - The RTMS stream ID
 * @param {string} secret - The secret key used for signing
 * @returns {string} HMAC SHA256 signature
 */
function generateSignature(clientId, meetingUuid, streamId, secret) {
    const message = `${clientId},${meetingUuid},${streamId}`;
    return crypto.createHmac("sha256", secret).update(message).digest("hex");
}

/**
 * Webhook endpoint to receive events from Zoom
 */
app.post('/', (req, res) => {
    console.log('Received request:', JSON.stringify(req.body, null, 2));

    const { event, payload } = req.body;

    // Handle Zoom Webhook Endpoint Validation
    if (event === 'endpoint.url_validation' && payload?.plainToken) {
        console.log('Processing Zoom endpoint validation...');
        const hashForValidate = crypto.createHmac('sha256', ZOOM_SECRET_TOKEN)
            .update(payload.plainToken)
            .digest('hex');

        console.log(`Validation response:`, {
            plainToken: payload.plainToken,
            encryptedToken: hashForValidate
        });

        return res.json({
            plainToken: payload.plainToken,
            encryptedToken: hashForValidate
        });
    }

    // Handle RTMS Event when a meeting starts streaming
    if (payload?.event === 'meeting.rtms.started' && payload?.payload?.object) {
        console.log('Processing RTMS Event: meeting.rtms.started');

        try {
            const {
                clientId,
                payload: {
                    event: rtmsEvent, // Extract event name
                    payload: {
                        operator_id,
                        object: { meeting_uuid, rtms_stream_id, server_urls }
                    }
                }
            } = req.body;

            console.log('Extracted RTMS Data:', {
                rtmsEvent,
                clientId,
                meeting_uuid,
                rtms_stream_id,
                server_urls
            });

            // Establish WebSocket connection with RTMS signaling server
            connectToRTMSWebSocket(clientId, meeting_uuid, rtms_stream_id, server_urls);
        } catch (error) {
            console.error('Error processing RTMS event:', error);
        }
    } 
    // Log other Zoom events for debugging
    else if (event) {
        console.log(`Processing Zoom event: ${event}`);
    } 
    // Handle unknown event types
    else {
        console.log("Received an event but couldn't determine the type.");
    }

    res.sendStatus(200);
});

/**
 * Connects to the RTMS signaling WebSocket server
 * 
 * @param {string} clientId - The client ID
 * @param {string} meetingUuid - The meeting UUID
 * @param {string} streamId - The RTMS stream ID
 * @param {string} serverUrl - WebSocket URL for signaling server
 */
function connectToRTMSWebSocket(clientId, meetingUuid, streamId, serverUrl) {
    console.log(`Connecting to RTMS WebSocket server: ${serverUrl}`);

    const ws = new WebSocket(serverUrl, { rejectUnauthorized: false });

    // Set a timeout to prevent hanging if the connection is unresponsive
    const connectionTimeout = setTimeout(() => {
        console.error('Connection to WebSocket server timed out.');
        process.exit(1);
    }, 10000); // 10 seconds timeout

    ws.on("open", () => {
        clearTimeout(connectionTimeout);
        console.log("Connected to WebSocket server");

        // Periodically log connection status
        const connectionCheckInterval = setInterval(() => {
            console.log("Still connected...");
        }, 20000);

        // Generate authentication signature
        const signature = generateSignature(clientId, meetingUuid, streamId, CLIENT_SECRET);

        // Prepare handshake message for signaling server
        const handshakeMessage = {
            msg_type: "SIGNALING_HAND_SHAKE_REQ",
            protocol_version: 1,
            meeting_uuid: meetingUuid,
            rtms_stream_id: streamId,
            signature: signature
        };

        console.log("Sending handshake message:", JSON.stringify(handshakeMessage, null, 2));
        ws.send(JSON.stringify(handshakeMessage));

        // Handle WebSocket closure
        ws.on("close", (code, reason) => {
            clearInterval(connectionCheckInterval);
            console.log("RTMS WebSocket closed:", code, reason.toString());
            if (code === 1005) {
                console.log("Closing RTMS WebSocket connection due to code 1005.");
            }
        });
    });

    // Listen for messages from RTMS signaling server
    ws.on("message", (data) => {
        try {
            const message = JSON.parse(data);
            console.log("Received message from RTMS server:", JSON.stringify(message, null, 2));

            // If handshake is successful, proceed to media WebSocket connection
            if (message.msg_type === "SIGNALING_HAND_SHAKE_RESP" && message.status_code === "STATUS_OK") {
                const mediaServerUrls = message.media_server.server_urls;
                console.log("Media server URLs received:", mediaServerUrls);
                connectToMediaWebSocket(mediaServerUrls, clientId, meetingUuid, streamId);
            } else if (message.status_code === "STATUS_ERROR") {
                console.error("Error from signaling server:", message.reason);
            }
        } catch (error) {
            console.error("Error parsing RTMS server message:", error);
        }
    });

    // Handle WebSocket errors
    ws.on("error", (error) => {
        console.error("RTMS WebSocket error:", error);
    });
}

/**
 * Connects to the Media WebSocket server
 * 
 * @param {string} mediaServerUrls - Object containing WebSocket URLs for media server
 * @param {string} clientId - The client ID
 * @param {string} meetingUuid - The meeting UUID
 * @param {string} streamId - The RTMS stream ID
 */
function connectToMediaWebSocket(mediaServerUrls, clientId, meetingUuid, streamId) {
    console.log("Setting up media connections for:", mediaServerUrls);
    
    // Create session-specific directory
    const sessionDir = path.join(RECORDINGS_DIR, meetingUuid);
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Initialize file streams with headers for video
    const streams = {
        audio: mediaServerUrls.audio ? fs.createWriteStream(path.join(sessionDir, 'audio.raw')) : null,
        video: mediaServerUrls.video ? fs.createWriteStream(path.join(sessionDir, 'video.raw')) : null,
        metadata: fs.createWriteStream(path.join(sessionDir, 'metadata.jsonl'))
    };

    // Write H.264 headers if this is a video stream
    if (mediaServerUrls.video && streams.video) {
        streams.video.write(DEFAULT_H264_SPS);
        streams.video.write(DEFAULT_H264_PPS);
    }

    // Connect to the base media server URL instead of specific endpoints
    const baseUrl = mediaServerUrls.all || 'ws://0.0.0.0:8081';
    console.log(`Connecting to Media WebSocket: ${baseUrl}`);
    
    const mediaWs = new WebSocket(baseUrl);
    setupMediaConnection(mediaWs, 'media', clientId, meetingUuid, streamId, streams);
}

function setupMediaConnection(ws, type, clientId, meetingUuid, streamId, streams) {
    ws.on("open", () => {
        console.log(`Connected to ${type} WebSocket server`);

        // Send keep-alive messages every 20 seconds
        const keepAliveInterval = setInterval(() => {
            const keepAliveMsg = {
                msg_type: "KEEP_ALIVE_REQ",
                protocol_version: 1
            };
            ws.send(JSON.stringify(keepAliveMsg));
            console.log(`Sent ${type} keep-alive message`);
        }, 20000);

        // Generate authentication signature
        const mediaSignature = generateSignature(clientId, meetingUuid, streamId, CLIENT_SECRET);

        // Prepare handshake message
        const dataHandshakeMessage = {
            msg_type: "DATA_HAND_SHAKE_REQ",
            protocol_version: 1,
            meeting_uuid: meetingUuid,
            rtms_stream_id: streamId,
            signature: mediaSignature,
            payload_encryption: false
        };

        console.log(`Sending ${type} handshake message:`, JSON.stringify(dataHandshakeMessage, null, 2));
        ws.send(JSON.stringify(dataHandshakeMessage));

        // Handle WebSocket closure
        ws.on("close", (code, reason) => {
            console.log(`${type} WebSocket closed:`, code, reason.toString());
            
            // Clear any existing intervals
            if (keepAliveInterval) {
                clearInterval(keepAliveInterval);
            }

            // Close all streams
            Object.values(streams).forEach(stream => {
                if (stream && !stream.closed) {
                    console.log(`Closing stream for ${type}`);
                    stream.end();
                }
            });

            // Convert files if WebSocket was closed unexpectedly or normally
            if (code === 1006 || code === 1000) {
                console.log(`WebSocket closed with code ${code}. Starting conversion...`);
                // Wait a brief moment to ensure all streams are properly closed
                setTimeout(() => {
                    // Check file sizes before conversion
                    const audioPath = path.join(RECORDINGS_DIR, meetingUuid, 'audio.raw');
                    const videoPath = path.join(RECORDINGS_DIR, meetingUuid, 'video.raw');
                    
                    if (fs.existsSync(audioPath)) {
                        const audioSize = fs.statSync(audioPath).size;
                        console.log(`Audio file size: ${audioSize} bytes`);
                    }
                    
                    if (fs.existsSync(videoPath)) {
                        const videoSize = fs.statSync(videoPath).size;
                        console.log(`Video file size: ${videoSize} bytes`);
                    }

                    convertRawToPlayable(meetingUuid)
                        .then(() => {
                            console.log(`Conversion completed after WebSocket closure`);
                        })
                        .catch(error => {
                            console.error(`Conversion failed after WebSocket closure:`, error);
                        });
                }, 1000);
            }
        });
    });

    ws.on("message", (data) => {
        try {
            const message = JSON.parse(data);
            console.log(`Received ${type} message type:`, message.msg_type);

            switch (message.msg_type) {
                case "KEEP_ALIVE_RESP":
                    console.log(`Received ${type} keep-alive response`);
                    break;

                case "MEDIA_DATA_AUDIO":
                    if (streams.audio) {
                        if (!message.content?.data) {
                            console.log('Audio message missing data field:', message);
                            return;
                        }

                        try {
                            const audioData = Buffer.from(message.content.data, 'base64');
                            console.log(`Received audio chunk of size: ${audioData.length} bytes`);
                            streams.audio.write(audioData);
                            
                            const mediaMeta = {
                                timestamp: message.content.timestamp,
                                user_id: message.content.user_id,
                                type: 'audio',
                                size: audioData.length
                            };
                            streams.metadata.write(JSON.stringify(mediaMeta) + '\n');
                        } catch (error) {
                            console.error('Error processing audio data:', error);
                        }
                    }
                    break;

                case "MEDIA_DATA_TRANSCRIPT":
                    console.log("message", message.content)
                    
                    if (message.content.data){
                        fetch(`${BASE_URL}/add-to-db`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                message: message.content
                            })
                        })
                        .then(response => response.json())
                        .then(data => console.log(data))
                        .catch(error => console.error('Error:', error));
                    }
                    //do a post request to the base url with the data being a random number
                    
                    
                    
                    if (streams.transcript) {
                        try {
                            const transcriptData = message.content?.data || '';
                            if (transcriptData) {
                                const transcriptEntry = {
                                    timestamp: message.content.timestamp,
                                    user_id: message.content.user_id,
                                    text: transcriptData
                                };
                                streams.transcript.write(JSON.stringify(transcriptEntry) + '\n');
                                console.log('Transcript:', transcriptData);
                            }
                        } catch (error) {
                            console.error('Error processing transcript data:', error);
                        }
                    }
                    break;

                case "DATA_HAND_SHAKE_RESP":
                    if (message.status_code === "STATUS_OK") {
                        console.log(`${type} handshake successful`);
                        const sessionInfo = {
                            meetingUuid,
                            streamId,
                            clientId,
                            startTime: new Date().toISOString(),
                            type: 'session_start'
                        };
                        streams.metadata.write(JSON.stringify(sessionInfo) + '\n');
                    }
                    break;

                case "STREAM_STATE_UPDATE":
                    if (message.state === 'TERMINATED') {
                        console.log(`Stream terminated. Reason: ${message.reason}`);
                        // Close all streams before conversion
                        Object.values(streams).forEach(stream => stream.end());
                        
                        // Convert raw files to playable formats
                        convertRawToPlayable(meetingUuid);
                    }
                    break;
                
                case "MEDIA_DATA_VIDEO":
                    console.log("message", message.content)
                    break;

                default:
                    console.log(`Unhandled ${type} message type:`, message.msg_type);
                    console.log('Message content:', message);  // Log the full message for debugging
                    break;
            }
        } catch (error) {
            console.error(`Error processing ${type} message:`, error);
            console.error('Raw message data:', data.toString());
        }
    });

    ws.on("error", (error) => {
        console.error(`${type} WebSocket error:`, error);
        // Close all streams on error
        Object.values(streams).forEach(stream => stream.end());
    });
}

// Update convertRawToPlayable to return a Promise
function convertRawToPlayable(meetingUuid) {
    return new Promise((resolve, reject) => {
        const sessionDir = path.join(RECORDINGS_DIR, meetingUuid);
        console.log(`Converting raw files in ${sessionDir}`);

        const audioRawPath = path.join(sessionDir, 'audio.raw');
        const transcriptPath = path.join(sessionDir, 'transcript.txt');
        const conversionPromises = [];

        // Convert audio if raw file exists
        if (fs.existsSync(audioRawPath)) {
            console.log('Starting audio conversion...');
            
            const audioProcess = spawn('ffmpeg', [
                '-i', audioRawPath,
                '-c:a', 'libmp3lame',
                '-q:a', '3',
                path.join(sessionDir, 'audio.mp3')
            ]);

            const audioPromise = new Promise((resolveAudio, rejectAudio) => {
                audioProcess.on('close', code => {
                    if (code === 0) {
                        console.log('Audio conversion completed successfully');
                        resolveAudio();
                    } else {
                        const error = new Error(`Audio conversion failed with code ${code}`);
                        console.error(error);
                        rejectAudio(error);
                    }
                });
            });

            audioProcess.stderr.on('data', (data) => {
                console.log('FFmpeg Audio:', data.toString());
            });

            conversionPromises.push(audioPromise);
        }

        // Format transcript file if it exists
        if (fs.existsSync(transcriptPath)) {
            const transcriptPromise = new Promise((resolveTranscript, rejectTranscript) => {
                try {
                    const transcriptData = fs.readFileSync(transcriptPath, 'utf8');
                    const lines = transcriptData.split('\n').filter(line => line.trim());
                    const formattedTranscript = lines.map(line => {
                        try {
                            const entry = JSON.parse(line);
                            const timestamp = new Date(entry.timestamp).toISOString();
                            return `[${timestamp}] ${entry.text}`;
                        } catch (e) {
                            return line;
                        }
                    }).join('\n');
                    
                    fs.writeFileSync(path.join(sessionDir, 'transcript_formatted.txt'), formattedTranscript);
                    resolveTranscript();
                } catch (error) {
                    console.error('Error formatting transcript:', error);
                    rejectTranscript(error);
                }
            });
            
            conversionPromises.push(transcriptPromise);
        }

        // Wait for all conversions to complete
        Promise.all(conversionPromises)
            .then(() => {
                console.log(`All conversions completed for session ${meetingUuid}`);
                resolve();
            })
            .catch(error => {
                console.error(`Conversion failed for session ${meetingUuid}:`, error);
                reject(error);
            });
    });
}

// Start the Express server
app.listen(PORT, () => {
    console.log(`Zoom Webhook listening on port ${PORT}`);
});

// Gracefully close WebSocket connections on exit
process.on("SIGINT", () => {
    console.log("Closing WebSocket connections...");
    process.exit();
});
