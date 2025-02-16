module.exports = {
    HANDSHAKE_PORT: 9092,
    MEDIA_PORT: 8081,
    HOST: "0.0.0.0",
    ENDPOINTS: {
        AUDIO: "/audio",
        VIDEO: "/video",
        TRANSCRIPT: "/transcript",
        ALL: "/all"
    },
    MEDIA: {
        CHUNK_SIZE: 4096,
        INTERVAL_MS: 100
    },
    KEEP_ALIVE_INTERVAL: 5000,
    DIRECTORIES: {
        DATA: "data",
        PCM: "data"
    }
}; 