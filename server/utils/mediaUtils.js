const { exec } = require("child_process");
const fs = require("fs");
const crypto = require("crypto");

class MediaUtils {
    static convertToPCM(inputFile, outputFile, callback) {
        const command = `ffmpeg -y -i "${inputFile}" -f s16le -acodec pcm_s16le -ar 16000 -ac 1 "${outputFile}"`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error converting file ${inputFile}:`, error);
            } else {
                console.log(`Converted ${inputFile} to ${outputFile}`);
            }
            callback(error);
        });
    }

    static convertVideo(inputFile, fps, callback) {
        const outputFile = fps <= 5 ? 
            inputFile.replace('.webm', '_%04d.jpg') :
            inputFile.replace('.webm', '.mp4');
            
        const command = fps <= 5 ?
            `ffmpeg -i "${inputFile}" -vf fps=${fps} -q:v 2 "${outputFile}"` :
            `ffmpeg -i "${inputFile}" -c:v libx264 -preset ultrafast -crf 18 -r ${fps} "${outputFile}"`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error converting video ${inputFile}:`, error);
            } else {
                console.log(`Converted ${inputFile} to ${outputFile}`);
            }
            callback(error, outputFile);
        });
    }

    static initializePCMConversion(dataDir, callback) {
        const files = fs
            .readdirSync(dataDir)
            .filter((file) => file.endsWith(".m4a") || file.endsWith(".mp4"));

        let remaining = files.length;
        if (remaining === 0) {
            callback();
            return;
        }

        files.forEach((file) => {
            const inputFile = path.join(dataDir, file);
            const outputFile = path.join(dataDir, `${path.parse(file).name}.pcm`);
            this.convertToPCM(inputFile, outputFile, (error) => {
                if (--remaining === 0) {
                    callback();
                }
            });
        });
    }

    static generateEncryptionKeys(meetingUuid, rtmsStreamId, secret) {
        return {
            audio: crypto.createHmac('sha256', secret)
                .update(`${meetingUuid},${rtmsStreamId},AUDIO`)
                .digest('hex'),
            video: crypto.createHmac('sha256', secret)
                .update(`${meetingUuid},${rtmsStreamId},VIDEO`)
                .digest('hex'),
            // Add other media types...
        };
    }

    static encryptPayload(data, key) {
        // Add encryption logic
    }
}

module.exports = MediaUtils; 