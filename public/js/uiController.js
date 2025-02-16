class UIController {
    static init() {
        this.attachEventListeners();
        // Initialize button states
        this.resetUIState();
        window.currentMeetingId = null; // Initialize meeting ID storage
        window.lastWebhookPayload = null; // Store the last webhook payload
        console.log("UI Controller initialized");
    }

    static attachEventListeners() {
        document.getElementById('validateBtn').addEventListener('click', APIHandler.validateWebhook);
        document.getElementById('sendBtn').addEventListener('click', () => {
            // Start Meeting button
            APIHandler.sendWebhook(true); // true indicates new meeting
        });
        document.getElementById('pauseBtn').addEventListener('click', () => this.handlePause());
        document.getElementById('resumeBtn').addEventListener('click', () => this.handleResume());
        document.getElementById('stopBtn').addEventListener('click', () => this.handleStop());
        document.getElementById('startRtmsBtn').addEventListener('click', () => {
            // Start RTMS button - reuse the last webhook payload
            if (window.lastWebhookPayload) {
                APIHandler.sendWebhook(false); // false indicates reuse existing meeting
            } else {
                console.error("No previous meeting payload found");
                this.showError("No previous meeting found. Please start a new meeting first.");
            }
        });
        document.getElementById('endBtn').addEventListener('click', () => this.handleEnd());

        // Add input validation
        const webhookInput = document.getElementById('webhookUrl');
        webhookInput.addEventListener('input', () => {
            document.getElementById('sendBtn').disabled = true;
            window.validatedWebhookUrl = null;
        });
    }

    static updateButtonStates(isActive) {
        document.getElementById('sendBtn').disabled = true; // Always disabled during active session
        document.getElementById('pauseBtn').disabled = !isActive;
        document.getElementById('stopBtn').disabled = !isActive;
        document.getElementById('validateBtn').disabled = isActive;
        document.getElementById('webhookUrl').disabled = isActive;
        document.getElementById('resumeBtn').disabled = true;
        document.getElementById('startRtmsBtn').disabled = true; // Disabled during active session
        document.getElementById('endBtn').disabled = false; // Always enabled during active session
    }

    static handlePause() {
        if (!RTMSState.mediaSocket || RTMSState.sessionState === CONFIG.STATES.STOPPED) return;
        
        try {
            console.log("Pausing session...");
            RTMSState.sessionState = CONFIG.STATES.PAUSED;
            RTMSState.isStreamingEnabled = false;
            
            // Don't stop media recorders, just pause them
            if (RTMSState.videoRecorder?.state === 'recording') {
                RTMSState.videoRecorder.pause();
            }
            if (RTMSState.audioRecorder?.state === 'recording') {
                RTMSState.audioRecorder.pause();
            }
            
            WebSocketHandler.sendSessionStateUpdate(CONFIG.STATES.PAUSED, "ACTION_BY_USER");
            
            document.getElementById('resumeBtn').disabled = false;
            document.getElementById('pauseBtn').disabled = true;
            // Ensure end button stays enabled
            document.getElementById('endBtn').disabled = false;

        } catch (error) {
            console.error("Error pausing session:", error);
        }
    }

    static handleResume() {
        if (!RTMSState.mediaSocket || RTMSState.sessionState === CONFIG.STATES.STOPPED) {
            console.log("Cannot resume: session is stopped or no media socket");
            alert('Session is stopped. Please start a new session.');
            return;
        }

        try {
            console.log("Resuming session...");
            console.log("Current state:", RTMSState.sessionState);
            
            RTMSState.sessionState = CONFIG.STATES.RESUMED;
            RTMSState.isStreamingEnabled = true;

            // Log current button states
            console.log("Button states before resume:", {
                pause: document.getElementById('pauseBtn').disabled,
                resume: document.getElementById('resumeBtn').disabled,
                stop: document.getElementById('stopBtn').disabled,
                startRtms: document.getElementById('startRtmsBtn').disabled,
                send: document.getElementById('sendBtn').disabled,
                end: document.getElementById('endBtn').disabled
            });

            // Resume media recorders
            if (RTMSState.videoRecorder?.state === 'paused') {
                console.log("Resuming video recorder");
                RTMSState.videoRecorder.resume();
            }
            if (RTMSState.audioRecorder?.state === 'paused') {
                console.log("Resuming audio recorder");
                RTMSState.audioRecorder.resume();
            }

            // Resume speech recognition
            if (RTMSState.recognition) {
                try {
                    console.log("Attempting to start speech recognition");
                    RTMSState.recognition.start();
                } catch (error) {
                    console.log("Speech recognition already started:", error);
                }
            }

            // Enable media tracks
            console.log("Enabling media tracks");
            MediaHandler.toggleMediaTracks(true);
            
            // Send state update to server
            console.log("Sending RESUMED state update to server");
            WebSocketHandler.sendSessionStateUpdate(CONFIG.STATES.RESUMED, "ACTION_BY_USER");
            
            // Update UI immediately
            console.log("Updating UI for RESUMED state");
            this.updateUIForState(CONFIG.STATES.RESUMED);

            // Log final button states
            console.log("Button states after resume:", {
                pause: document.getElementById('pauseBtn').disabled,
                resume: document.getElementById('resumeBtn').disabled,
                stop: document.getElementById('stopBtn').disabled,
                startRtms: document.getElementById('startRtmsBtn').disabled,
                send: document.getElementById('sendBtn').disabled,
                end: document.getElementById('endBtn').disabled
            });

        } catch (error) {
            console.error("Error resuming session:", error);
            console.log("Error details:", {
                error: error.message,
                stack: error.stack
            });
        }
    }

    static handleStop() {
        if (!RTMSState.mediaSocket || RTMSState.sessionState === CONFIG.STATES.STOPPED) return;
        
        console.log("Stopping RTMS session...");
        RTMSState.sessionState = CONFIG.STATES.STOPPED;
        RTMSState.isStreamingEnabled = false;
        
        if (RTMSState.mediaSocket?.readyState === WebSocket.OPEN) {
            WebSocketHandler.sendSessionStateUpdate(CONFIG.STATES.STOPPED, "ACTION_BY_USER");
        }

        // Close WebSocket connection
        if (RTMSState.mediaSocket) {
            RTMSState.mediaSocket.close();
            RTMSState.mediaSocket = null;
        }

        // Keep media stream active but stop sending data
        if (RTMSState.videoRecorder?.state === 'recording') {
            RTMSState.videoRecorder.pause();
        }
        if (RTMSState.audioRecorder?.state === 'recording') {
            RTMSState.audioRecorder.pause();
        }

        // Update button states for stopped RTMS
        document.getElementById('sendBtn').disabled = true;
        document.getElementById('startRtmsBtn').disabled = false; // Enable Start RTMS
        document.getElementById('endBtn').disabled = false; // Keep End Meeting enabled
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('resumeBtn').disabled = true;
        document.getElementById('stopBtn').disabled = true;
        document.getElementById('validateBtn').disabled = false;
        document.getElementById('webhookUrl').disabled = false;

        // Keep the current meeting ID
        console.log("RTMS stopped, Start RTMS button enabled");
    }

    static resetUIState() {
        // Enable/disable appropriate buttons
        document.getElementById('sendBtn').disabled = !window.validatedWebhookUrl;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('resumeBtn').disabled = true;
        document.getElementById('stopBtn').disabled = true;
        document.getElementById('startRtmsBtn').disabled = true;
        document.getElementById('endBtn').disabled = true;
        document.getElementById('validateBtn').disabled = false;
        document.getElementById('webhookUrl').disabled = false;

        console.log("UI state reset completed");
    }

    static handleEnd() {
        console.log("Ending meeting...");
        RTMSState.isStreamingEnabled = false;
        RTMSState.sessionState = CONFIG.STATES.STOPPED;
        
        // Clear all stored meeting data
        localStorage.removeItem('currentMeetingId');
        window.currentMeetingId = null;
        window.lastWebhookPayload = null; // Clear the stored webhook payload

        // Stop all recordings and streams
        MediaHandler.cleanup();

        if (RTMSState.mediaSocket?.readyState === WebSocket.OPEN) {
            WebSocketHandler.sendSessionStateUpdate(CONFIG.STATES.STOPPED, "MEETING_ENDED");
            RTMSState.mediaSocket.close();
        }

        // Reset all state
        RTMSState.mediaSocket = null;
        RTMSState.mediaStream = null;
        RTMSState.videoRecorder = null;
        RTMSState.audioRecorder = null;

        // Reset UI completely
        this.resetUIState();
        
        // Clear logs and transcripts
        document.getElementById('transcript').innerHTML = '';
        document.getElementById('response').innerHTML = '';
    }

    static handleIncomingMedia(message) {
        if (message.msg_type === "MEDIA_DATA_VIDEO") {
            this.updateVideoElement(message.content.data);
        }
        else if (message.msg_type === "MEDIA_DATA_AUDIO") {
            this.updateAudioElement(message.content.data);
        }
    }

    static updateVideoElement(videoData) {
        const blob = new Blob([Uint8Array.from(atob(videoData), c => c.charCodeAt(0))], 
            { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        const mediaVideo = document.getElementById('mediaVideo');
        if (mediaVideo.src) {
            URL.revokeObjectURL(mediaVideo.src);
        }
        mediaVideo.src = videoUrl;
    }

    static updateAudioElement(audioData) {
        const blob = new Blob([Uint8Array.from(atob(audioData), c => c.charCodeAt(0))], 
            { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(blob);
        const mediaAudio = document.getElementById('mediaAudio');
        if (mediaAudio.src) {
            URL.revokeObjectURL(mediaAudio.src);
        }
        mediaAudio.src = audioUrl;
    }

    static showError(message) {
        console.error("UI Error:", message);
        const responseDiv = document.getElementById('response');
        if (responseDiv) {
            responseDiv.innerHTML = message;
        }
    }

    static addSystemLog(type, message, details = null) {
        const logsDiv = document.getElementById('system-logs');
        if (!logsDiv) return;

        console.log('Adding system log:', { type, message, details });

        const entry = document.createElement('div');
        entry.className = 'log-entry system-log';
        
        if (type === 'Signaling') {
            entry.classList.add('signaling-log');
            if (details && typeof details.status === 'string') {
                entry.classList.add(details.status.toLowerCase());
            }
        }
        
        const timestamp = new Date().toLocaleTimeString();
        
        entry.innerHTML = `
            <div class="log-header">
                <div class="log-title">
                    <i class="fas ${type === 'Signaling' ? 'fa-signal' : 'fa-info-circle'}"></i>
                    <span>${type}: ${message}</span>
                </div>
                <div class="log-controls">
                    <span class="log-timestamp">${timestamp}</span>
                    ${details ? '<i class="fas fa-chevron-down"></i>' : ''}
                </div>
            </div>
            ${details ? `
            <div class="log-content">
                <div class="content-wrapper">
                    <pre>${JSON.stringify(details, null, 2)}</pre>
                </div>
            </div>
            ` : ''}
        `;

        if (details) {
            const header = entry.querySelector('.log-header');
            const content = entry.querySelector('.log-content');
            header.addEventListener('click', () => {
                const arrow = header.querySelector('.fas');
                arrow.classList.toggle('fa-chevron-down');
                arrow.classList.toggle('fa-chevron-up');
                content.classList.toggle('expanded');
            });
        }

        logsDiv.appendChild(entry);
        logsDiv.scrollTop = logsDiv.scrollHeight;
    }

    static addSignalingLog(event, details = null) {
        this.addSystemLog('Signaling', event, {
            status: 'info',
            timestamp: new Date().toISOString(),
            ...details
        });
    }

    static handleServerStopConfirmation() {
        const validatedUrl = window.validatedWebhookUrl; // Store the current validated URL
        this.resetUIState();
        window.validatedWebhookUrl = validatedUrl; // Restore the validated URL
        document.getElementById('sendBtn').disabled = !window.validatedWebhookUrl;
        console.log("Server stop confirmed, UI reset");
    }

    static async sendWebhook(url, isNewMeeting = true, meetingId = null) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    newMeeting: isNewMeeting,
                    meetingId: meetingId || window.currentMeetingId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Only store new meeting ID if it's a new meeting
            if (isNewMeeting && data.meetingId) {
                localStorage.setItem('currentMeetingId', data.meetingId);
                window.currentMeetingId = data.meetingId;
            }
            
            this.addSignalingLog('Webhook sent', data);

            // After webhook validation, setup WebSocket
            await WebSocketHandler.setupWebSocket(url);
            // After WebSocket and signaling are connected, start media stream
            await MediaHandler.startMediaStream(url);
            // Update button states
            this.updateButtonStates(true);

        } catch (error) {
            console.error("Send webhook error:", error);
            this.showError(`Failed to send webhook: ${error.message}`);
            throw error;
        }
    }

    static storeMeetingId(meetingId) {
        window.currentMeetingId = meetingId;
        console.log("Stored meeting ID:", meetingId);
    }

    static updateUIForState(state) {
        console.log("Updating UI for state:", state);
        console.log("Current button states:", {
            pause: document.getElementById('pauseBtn').disabled,
            resume: document.getElementById('resumeBtn').disabled,
            stop: document.getElementById('stopBtn').disabled,
            startRtms: document.getElementById('startRtmsBtn').disabled,
            send: document.getElementById('sendBtn').disabled,
            end: document.getElementById('endBtn').disabled
        });

        switch(state) {
            case CONFIG.STATES.RESUMED:
                console.log("Setting UI for RESUMED state");
                document.getElementById('pauseBtn').disabled = false;
                document.getElementById('resumeBtn').disabled = true;
                document.getElementById('stopBtn').disabled = false;
                document.getElementById('startRtmsBtn').disabled = true;
                document.getElementById('sendBtn').disabled = true;
                document.getElementById('endBtn').disabled = false;
                break;
            case CONFIG.STATES.PAUSED:
                document.getElementById('pauseBtn').disabled = true;
                document.getElementById('resumeBtn').disabled = false;
                document.getElementById('stopBtn').disabled = false;
                document.getElementById('startRtmsBtn').disabled = true;
                document.getElementById('sendBtn').disabled = true;
                document.getElementById('endBtn').disabled = false;
                break;
            // ... other states ...
        }

        console.log("Updated button states:", {
            pause: document.getElementById('pauseBtn').disabled,
            resume: document.getElementById('resumeBtn').disabled,
            stop: document.getElementById('stopBtn').disabled,
            startRtms: document.getElementById('startRtmsBtn').disabled,
            send: document.getElementById('sendBtn').disabled,
            end: document.getElementById('endBtn').disabled
        });
    }

    // Add this method to handle incoming state updates
    static handleStateUpdate(message) {
        console.log("Received state update message:", message);
        
        if (message.msg_type === "SESSION_STATE_UPDATE" || message.msg_type === "UI_STATE_UPDATE") {
            console.log("Processing state update:", {
                type: message.msg_type,
                state: message.state,
                ui_state: message.ui_state
            });

            if (message.ui_state) {
                Object.entries(message.ui_state).forEach(([buttonId, state]) => {
                    const button = document.getElementById(buttonId);
                    if (button) {
                        console.log(`Updating button ${buttonId}:`, {
                            before: button.disabled,
                            after: state.disabled
                        });
                        button.disabled = state.disabled;
                    } else {
                        console.log(`Button ${buttonId} not found`);
                    }
                });
            }
            
            // Update global state
            console.log("Updating global state:", {
                before: RTMSState.sessionState,
                after: message.state
            });
            RTMSState.sessionState = message.state;
        }
    }
}

// Initialize UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const responseDiv = document.getElementById('response');
    if (responseDiv) {
        responseDiv.innerHTML = ''; // Clear existing content
    }
    UIController.init();
});

// Event types enum
const EventTypes = {
    WEBSOCKET: 'WebSocket',
    WEBHOOK: 'Webhook',
    SYSTEM: 'System',
    MESSAGE: 'Message',
    RTMS: 'RTMS',
    SIGNALING: 'Signaling'
};

// Store all transcripts and events
let transcriptHistory = [];
let eventHistory = [];

function parseEventData(data) {
    try {
        // If it's a string, try to parse it
        if (typeof data === 'string') {
            data = JSON.parse(data);
        }

        // For RTMS events (they're nested in sent.eventType)
        if (data.sent && data.sent.eventType) {
            return {
                type: 'rtms',
                name: data.sent.eventType,
                data: data
            };
        }

        // For WebSocket messages with msg_type (media data)
        if (data.msg_type) {
            return {
                type: data.msg_type.toLowerCase(),
                name: data.msg_type,  // Keep the original case for display
                data: data
            };
        }

        // For webhook validation
        if (data.event === 'endpoint.url_validation') {
            return {
                type: 'webhook',
                name: 'endpoint.url_validation',
                data: data
            };
        }

        // For console messages
        if (typeof data === 'string' && data.includes('Received message')) {
            const match = data.match(/Received message on media channel: (\w+)/);
            if (match) {
                return {
                    type: match[1].toLowerCase(),
                    name: match[1],
                    data: { message: data }
                };
            }
        }

        return {
            type: 'unknown',
            name: data.toString(),
            data: data
        };
    } catch (e) {
        console.error('Error parsing event data:', e);
        return {
            type: 'error',
            name: 'parse error',
            data: data
        };
    }
}

// First, let's clear any existing handlers
document.removeEventListener('DOMContentLoaded', setupSearch);

// Only handle webhook events
function addEventLog(data) {
    // Strict validation - only accept webhook events
    if (!data || !data.sent || !data.sent.eventType) {
        console.log('Skipping non-webhook event:', data);
        return;
    }

    const responseDiv = document.getElementById('response');
    if (!responseDiv) {
        console.error('Response div not found');
        return;
    }

    const entry = document.createElement('div');
    entry.className = 'log-entry webhook-event';
    
    const eventName = data.sent.eventType;
    const timestamp = new Date().toLocaleTimeString();
    
    entry.innerHTML = `
        <div class="log-header">
            <div class="log-title">
                <i class="fas fa-broadcast-tower"></i>
                <span>${eventName}</span>
            </div>
            <div class="log-controls">
                <span class="log-timestamp">${timestamp}</span>
                <i class="fas fa-chevron-down"></i>
            </div>
        </div>
        <div class="log-content">
            <button class="copy-button" title="Copy to clipboard">
                <i class="fas fa-copy"></i>
            </button>
            <div class="content-wrapper">
                <pre>${JSON.stringify(data, null, 2)}</pre>
            </div>
        </div>
    `;

    // Add click handlers
    const header = entry.querySelector('.log-header');
    const content = entry.querySelector('.log-content');
    const copyButton = entry.querySelector('.copy-button');

    header.addEventListener('click', () => {
        const arrow = header.querySelector('.fa-chevron-down, .fa-chevron-up');
        arrow.classList.toggle('fa-chevron-down');
        arrow.classList.toggle('fa-chevron-up');
        content.classList.toggle('expanded');
    });

    copyButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const data = entry.querySelector('pre').textContent;
        navigator.clipboard.writeText(data);
        copyButton.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
    });

    responseDiv.appendChild(entry);
}

// Only expose what's absolutely necessary
window.addEventLog = addEventLog;

// Function to clear logs
function clearLogs() {
    document.getElementById('response').innerHTML = '';
    eventHistory = [];
}

// Function to clear transcripts
function clearTranscripts() {
    document.getElementById('transcript').innerHTML = '';
    transcriptHistory = [];
}

// Handle system events
function handleSystemEvent(event, data) {
    addEventLog({ event, data });
}

// Handle regular messages
function handleMessage(message) {
    addEventLog(message);
}

// Handle signaling events
function handleSignalingEvent(data) {
    addEventLog(data);
}