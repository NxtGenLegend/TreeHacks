module.exports = {
    RTMS_STOP_REASON: {
        UNKNOWN: "UNKNOWN",
        STOP_BC_HOST_TRIGGERED: "STOP_BC_HOST_TRIGGERED",
        // ... other stop reasons
    },
    RTMS_MESSAGE_TYPE: {
        UNKNOWN: "UNKNOWN",
        SIGNALING_HANDSHAKE_REQ: "SIGNALING_HANDSHAKE_REQ",
        // ... other message types
    },
    // ... other constants
    
    MEDIA_CONTENT_TYPE: {
        RAW_AUDIO: "RAW_AUDIO",
        RAW_VIDEO: "RAW_VIDEO"
    },
    
    AUDIO_SAMPLE_RATE: {
        SR_16K: 16000
    },
    
    AUDIO_CHANNEL: {
        MONO: 1
    },
    
    MEDIA_PAYLOAD_TYPE: {
        L16: "L16",
        JPG: "JPG"
    },
    
    MEDIA_DATA_OPTION: {
        AUDIO_MIXED_STREAM: "AUDIO_MIXED_STREAM"
    },
    
    MEDIA_RESOLUTION: {
        HD: "HD"
    },

    RTMS_EVENT_TYPE: {
        UNKNOWN: "UNKNOWN",
        ACTIVE_SPEAKER_CHANGE: "ACTIVE_SPEAKER_CHANGE",
        PARTICIPANT_JOIN: "PARTICIPANT_JOIN",
        PARTICIPANT_LEAVE: "PARTICIPANT_LEAVE",
        FIRST_PACKET_TIMESTAMP: "FIRST_PACKET_TIMESTAMP"
    },

    RTMS_SESSION_STATE: {
        INACTIVE: "INACTIVE",
        INITIALIZE: "INITIALIZE",
        STARTED: "STARTED",
        PAUSED: "PAUSED",
        RESUMED: "RESUMED",
        STOPPED: "STOPPED"
    },

    RTMS_STREAM_STATE: {
        INACTIVE: "INACTIVE",
        ACTIVE: "ACTIVE",
        INTERRUPTED: "INTERRUPTED",
        TERMINATING: "TERMINATING",
        TERMINATED: "TERMINATED"
    }
}; 