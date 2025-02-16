class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 320; // 20ms at 16kHz
        this.buffer = new Float32Array(this.bufferSize);
        this.offset = 0;
        console.log('AudioProcessor initialized'); // Debug log
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input || !input[0]) {
            console.log('No input data received'); // Debug log
            return true;
        }
        
        const inputChannel = input[0];
        console.log('Processing audio chunk, size:', inputChannel.length); // Debug log

        // Copy input to buffer
        for (let i = 0; i < inputChannel.length; i++) {
            this.buffer[this.offset + i] = inputChannel[i];
        }

        this.offset += inputChannel.length;

        // When buffer is full, send it
        if (this.offset >= this.bufferSize) {
            console.log('Buffer full, converting to PCM'); // Debug log
            const pcmData = new Int16Array(this.bufferSize);
            for (let i = 0; i < this.bufferSize; i++) {
                pcmData[i] = Math.max(-32768, Math.min(32767, this.buffer[i] * 32768));
            }

            console.log('Sending PCM data to main thread'); // Debug log
            this.port.postMessage({
                pcmData: pcmData.buffer
            }, [pcmData.buffer]);

            this.buffer = new Float32Array(this.bufferSize);
            this.offset = 0;
        }

        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor); 