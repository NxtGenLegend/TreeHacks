let ws;

function setupWebSocket() {
    ws = new WebSocket(CONFIG.WS_URL);
    
    ws.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            // Only log to console
            console.log('WebSocket message received:', data);
        } catch (e) {
            console.error('Error parsing WebSocket message:', e);
        }
    };

    ws.onopen = function() {
        console.log('WebSocket connected');
    };

    ws.onclose = function() {
        console.log('WebSocket disconnected');
    };

    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
}

// Only expose what's needed
window.setupWebSocket = setupWebSocket;

class WebSocketHandler {
    static async setupWebSocket(serverUrl) {
        let wsUrl = serverUrl;
        if (wsUrl.includes('replit.app')) {
            wsUrl = `ws://${CONFIG.WS_ENDPOINTS.DEFAULT_HOST}:${CONFIG.WS_ENDPOINTS.DEFAULT_PORT}`;
        }

        // Create signaling socket
        const signalingSocket = new WebSocket(`${wsUrl}/signaling`);
        
        // Log signaling socket events
        signalingSocket.onopen = () => {
            UIController.addSignalingLog('Signaling Socket Connected');
        };

        signalingSocket.onclose = () => {
            UIController.addSignalingLog('Signaling Socket Closed');
        };

        signalingSocket.onerror = (error) => {
            UIController.addSignalingLog('Signaling Socket Error', { error: error.message });
        };

        signalingSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                UIController.addSignalingLog(`Received ${data.msg_type}`, data);
            } catch (error) {
                UIController.addSignalingLog('Error Processing Message', { error: error.message });
            }
        };

        // Setup media socket
        RTMSState.mediaSocket = new WebSocket(`${wsUrl}/all`);
        this.setupWebSocketHandlers();
    }

    static setupWebSocketHandlers() {
        RTMSState.mediaSocket.onopen = this.handleOpen;
        RTMSState.mediaSocket.onmessage = this.handleMessage;
        RTMSState.mediaSocket.onclose = this.handleClose;
        RTMSState.mediaSocket.onerror = this.handleError;
    }

    static handleOpen = () => {
        UIController.addSystemLog('Media Socket', 'Connected to media server');
        RTMSState.sessionState = CONFIG.STATES.STARTED;
        MediaHandler.startRecording();
    }

    static handleMessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            // Handle signaling logs separately
            if (data.msg_type === 'SIGNALING_LOG') {
                console.log('Received signaling log:', data); // Debug log
                UIController.addSystemLog('Signaling', data.content.event, {
                    status: data.content.status,
                    ...data.content.details
                });
                return;
            }

            handleWebSocketMessage(event.data);
        } catch (error) {
            console.error('Error handling websocket message:', error);
        }
    }

    static handleClose = () => {
        UIController.addSystemLog('Media Socket', 'Connection closed');
        MediaHandler.stopRecording();
        UIController.handleStop();
    }

    static handleError = (error) => {
        UIController.addSystemLog('Media Socket', 'Connection error', { error: error.message });
        MediaHandler.stopRecording();
        UIController.handleStop();
    }

    static handleVideoData = async (event) => {
        if (event.data.size > 0 && RTMSState.mediaSocket?.readyState === WebSocket.OPEN && RTMSState.isStreamingEnabled) {
            await this.sendMediaData(event.data, "MEDIA_DATA_VIDEO");
        }
    }

    static handleAudioData = async (event) => {
        console.log('handleAudioData called');
        if (event.data.size > 0 && RTMSState.mediaSocket?.readyState === WebSocket.OPEN && RTMSState.isStreamingEnabled) {
            console.log('Audio data received from recorder, size:', event.data.size);
            console.log('WebSocket state:', RTMSState.mediaSocket.readyState);
            console.log('Streaming enabled:', RTMSState.isStreamingEnabled);
            
            const reader = new FileReader();
            reader.onloadend = async () => {
                console.log('Audio data read as ArrayBuffer');
                try {
                    await this.convertAudio(reader.result);
                } catch (error) {
                    console.error('Error in convertAudio:', error);
                }
            };
            reader.onerror = (error) => {
                console.error('Error reading audio data:', error);
            };
            reader.readAsArrayBuffer(event.data);
        } else {
            console.log('Skipping audio data:', {
                dataSize: event.data.size,
                wsState: RTMSState.mediaSocket?.readyState,
                streamingEnabled: RTMSState.isStreamingEnabled
            });
        }
    }

    static async sendMediaData(data, type) {
        try {
            const reader = new FileReader();
            
            reader.onloadend = async () => {
                let processedData;
                let metadata = {};
                
                if (type === "MEDIA_DATA_AUDIO") {
                    processedData = await this.convertAudio(reader.result);
                    if (!processedData) return; // Skip if conversion failed
                    
                    
                } else if (type === "MEDIA_DATA_VIDEO") {
                    processedData = await this.convertVideo(reader.result);
                    if (!processedData) return; // Skip if conversion failed
                    
                  
                }

                if (RTMSState.mediaSocket?.readyState === WebSocket.OPEN) {
                    UIController.addSystemLog('Media', `${type} sent`, { timestamp: Date.now() });
                    RTMSState.mediaSocket.send(JSON.stringify({
                        msg_type: type,
                        content: {
                            user_id: 0,
                            data: processedData,
                            metadata: metadata,
                            timestamp: Date.now()
                        }
                    }));
                }
            };
            
            reader.readAsArrayBuffer(data);
        } catch (error) {
            UIController.addSystemLog('Media', 'Error sending media data', { error: error.message });
        }
    }

    static async convertAudio(audioData) {
        try {
            console.log('Starting audio conversion');
            if (!this.audioContext) {
                console.log('Creating new AudioContext');
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                    sampleRate: 16000
                });
                
                try {
                    console.log('Loading audio-processor.js');
                    await this.audioContext.audioWorklet.addModule('js/audio-processor.js');
                    console.log('Audio processor loaded successfully');
                } catch (error) {
                    console.error('Failed to load audio processor:', error);
                    throw error;
                }

                const audioNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
                console.log('AudioWorkletNode created');
                
                audioNode.port.onmessage = (event) => {
                    console.log('Received message from audio processor:', event.data);
                    if (event.data.pcmData && RTMSState.mediaSocket?.readyState === WebSocket.OPEN) {
                        const pcmArray = new Int16Array(event.data.pcmData);
                        const base64Data = btoa(String.fromCharCode.apply(null, new Uint8Array(pcmArray.buffer)));
                        
                        console.log('Sending audio data over WebSocket');
                        RTMSState.mediaSocket.send(JSON.stringify({
                            msg_type: "MEDIA_DATA_AUDIO",
                            content: {
                                user_id: 0,
                                data: base64Data,
                                metadata: {
                                    content_type: "RAW_AUDIO",
                                    sample_rate: 16000,
                                    channel: 1,
                                    codec: "L16",
                                    data_opt: "AUDIO_MIXED_STREAM",
                                    send_interval: 20
                                },
                                timestamp: Date.now()
                            }
                        }));
                    }
                };

                audioNode.port.onmessageerror = (error) => {
                    console.error('Audio processor message error:', error);
                };

                this.audioNode = audioNode;
            }

            // Create source buffer
            console.log('Decoding audio data');
            const audioBuffer = await this.audioContext.decodeAudioData(audioData);
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            
            console.log('Connecting audio nodes');
            source.connect(this.audioNode);
            this.audioNode.connect(this.audioContext.destination);
            
            source.start(0);
            return true;

        } catch (error) {
            console.error("Error converting audio:", error);
            console.error("Error details:", error.message);
            console.error("Error stack:", error.stack);
            return null;
        }
    }

    static async convertVideo(videoData) {
        try {
            // Create a video element to decode the WebM
            const video = document.createElement('video');
            video.autoplay = true;
            video.muted = true;
            
            // Set up video source
            const videoUrl = URL.createObjectURL(new Blob([videoData], { type: 'video/webm' }));
            video.src = videoUrl;
            
            // Create canvas for frame extraction
            const canvas = document.createElement('canvas');
            canvas.width = 1280; // HD width
            canvas.height = 720; // HD height
            const ctx = canvas.getContext('2d');
            
            // Process current frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const jpegData = canvas.toDataURL('image/jpeg', 0.9);
            
            // Cleanup
            URL.revokeObjectURL(videoUrl);
            
            return jpegData.split(',')[1]; // Return base64 data only
        } catch (error) {
            console.error("Error converting video:", error);
            return null;
        }
    }

    static sendSessionStateUpdate(state, stopReason) {
        if (!RTMSState.mediaSocket || RTMSState.mediaSocket.readyState !== WebSocket.OPEN) return;

        UIController.addSystemLog('Session', `State updated to ${state}`, { stopReason });
        RTMSState.mediaSocket.send(JSON.stringify({
            msg_type: "SESSION_STATE_UPDATE",
            rmts_session_id: RTMSState.mediaSocket.rtmsSessionId,
            state: state,
            stop_reason: stopReason,
            timestamp: Date.now()
        }));
    }

    static closeConnections() {
        // Close media socket
        if (RTMSState.mediaSocket) {
            RTMSState.mediaSocket.close();
            RTMSState.mediaSocket = null;
        }
        
        // Close signaling socket
        if (RTMSState.signalingSocket) {
            RTMSState.signalingSocket.close();
            RTMSState.signalingSocket = null;
        }
    }

    static setupSignalingSocket(serverUrl) {
        return new Promise((resolve, reject) => {
            const wsUrl = serverUrl.replace('https://', 'wss://').replace('http://', 'ws://');
            RTMSState.signalingSocket = new WebSocket(`${wsUrl}/signaling`);
            
            RTMSState.signalingSocket.onopen = () => {
                console.log("Signaling WebSocket connected");
                UIController.addSystemLog('Signaling', 'Connection established');
                resolve();
            };
            
            RTMSState.signalingSocket.onerror = (error) => {
                console.error("Signaling WebSocket error:", error);
                UIController.addSystemLog('Signaling', 'Connection error', { error });
                reject(error);
            };
            
            RTMSState.signalingSocket.onclose = () => {
                console.log("Signaling WebSocket closed");
                UIController.addSystemLog('Signaling', 'Connection closed');
            };
            
            // Add message handler
            this.setupSignalingMessageHandler(RTMSState.signalingSocket);
        });
    }
}

function onSignalingEvent(data) {
    handleSignalingEvent(data);
} 