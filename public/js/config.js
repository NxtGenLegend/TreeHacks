const CONFIG = {
    STATES: {
        STARTED: "STARTED",
        PAUSED: "PAUSED",
        RESUMED: "RESUMED",
        STOPPED: "STOPPED"
    },
    MEDIA: {
        VIDEO_CONFIG: {
            mimeType: 'video/webm',
            videoBitsPerSecond: 1000000
        },
        AUDIO_CONFIG: {
            mimeType: 'audio/webm',
            audioBitsPerSecond: 128000
        }
    },
    WS_ENDPOINTS: {
        DEFAULT_PORT: 8081,
        DEFAULT_HOST: '0.0.0.0'
    }
};

// Global state
window.RTMSState = {
    mediaSocket: null,
    mediaStream: null,
    sessionState: CONFIG.STATES.STOPPED,
    isStreamingEnabled: true,
    videoRecorder: null,
    audioRecorder: null,
    recognition: null
}; 