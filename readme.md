# Realtime Media Streams Mock Server -- V.1.0

> **Confidential under NDA - Do Not Distribute**<br/>
> The information in this document is confidential and requires an NDA. It is intended only for partners in the Zoom RTMS Beta Developers program. Participation in the RTMS Beta Offering, including access to and use of these RTMS Beta Offering materials, is subject to Zoom's [Beta Program - Terms of Use](https://www.zoom.com/en/trust/beta-terms-and-conditions/?optimizely_user_id=2a2f4ff424d63a314b7536ade4a8c12d&amp_device_id=5039ff16-4ae8-42dc-bf77-49268ac0d6ff&_ics=1733334737195).

Repository: [github.com/zoom/rtms-mock-server-sample](https://github.com/zoom/rtms-mock-server-sample)

This is a mock server that simulates the WebSocket-based streaming of Zoom's Realtime Media Streams (RTMS). It provides a complete development and testing environment for client-server interactions, including media streaming, signaling, and webhook management.

Documentation: [Realtime Media Streams - Beta Developer Documentation](https://drive.google.com/file/d/1UDfgOisarScdSRx0BwuzNU6dkNjaHXsA/view?usp=sharing)

Video guide: [Testing the RTMS mock server](https://success.zoom.us/clips/share/kTCgY9H3TDGyKabbHELfhg)

## Sample client

A sample client (Express server) is available at `./client` to help test this mock server. The client implements connection handling and provides a user interface for testing different media formats.

Sample client features:

- Webhook endpoint implementation
- WebSocket connection handling
- Media streaming controls
- Incoming real time data logs

## Installation & setup

This app requires [FFmpeg](https://github.com/FFmpeg/FFmpeg) and [Node.js version 14]() or higher.

The app can be run locally by cloning and installing packages with npm or on [Docker](https://www.docker.com/).

**npm** <br/>
To setup with npm, install dependencies and run the app:

```bash
cd rtms-mock-server-sample

# Install dependencies
npm install

# Start the server
npm start
```

**Docker** <br/>
To setup with Docker, run the following:

```bash
cd rtms-mock-server-sample

# Option 1: Using docker-compose (recommended)
docker-compose up -d

# Option 2: Manual docker commands

# Build Docker image
docker build -t rtms-mock-server .

# Run the container
docker run -d \
  -p 9092:9092 \
  -p 8081:8081 \
  -v $(pwd)/data:/app/data \
  --name rtms-mock-server \
  rtms-mock-server

# View logs
docker logs -f rtms-mock-server
```

To stop the container:

```bash
docker stop rtms-mock-server
```

To restart the container:

```bash
docker start rtms-mock-server
```

## Using the sample client

Start the server (npm or Docker) and open the mock server at [http://localhost:9092](http://localhost:9092). The sample client at `./client` can now be used to consume media from the mock server.

In a new terminal, run the sample client:

```bash
node client/server.js
```

This opens up a server at `localhost:8000`. For webhook validation, the client will need to be exposed to the internet with a tunnel, like [ngrok](https://ngrok.com/).

```bash
ngrok http 8000
```

The ngrok URL will be used to validate the webhook endpoint. Copy your URL and paste it into the webhook URL field on the mock server (http://localhost:9092). Click validate. In the RTMS server and client you'll see confirmation of the validation.

You can now start a meeting and start streaming media to the client.

Click _Start Meeting_ and provide camera/microphone permissions. The client will start receiving media. Resume, Stop, and Start RTMS to control the media stream.

Media packets are sent to the client every 100ms. The client will log incoming packets to the console.

## Creating your own client

To start, you'll need to create a webhook receiver to handle incoming `meeting.rtms.started` events when streams are available. You'll also need to [validate the webhook URL](https://developers.zoom.us/docs/api/webhooks/#validate-your-webhook-endpoint). You can find the webhook verification token in [rtms_credentials.json](data/rtms_credentials.json).

The mock server will send the following POST requests to your webhook endpoint:

```json
{
  "event": "endpoint.url_validation",
  "payload": {
    "plainToken": "abc123"
  }
}
```

The webhook endpoint should respond with the following:

```json
{
  "plainToken": "abc123",
  "encryptedToken": "encrypted_token_hash"
}
```

When the webhook is validated and the meeting starts, you'll receive a `meeting.rtms.started` webhook payload.

**Meeting Started Webhook Payload:**

```json
{
  "event": "meeting.rtms.started",
  "payload": {
    "operator_id": "user123",
    "object": {
      "meeting_uuid": "uuid",
      "rtms_stream_id": "stream_id",
      "server_urls": "server_urls"
    }
  }
}
```

#### Handling WebSocket Connections to receive RTMS data

Once you receive the server urls in the webhook payload, you need to open a websocket connection with the server url, and send a handshake request in the following format:

**Handshake Request (Client → Mock Server):**

```json
{
  "msg_type": "SIGNALING_HAND_SHAKE_REQ",
  "protocol_version": 1,
  "meeting_uuid": "meeting_uuid",
  "rtms_stream_id": "stream_id",
  "signature": "hmac_sha256_signature"
}
```

**Note:** The `signature` field should be generated using HMAC-SHA256 with the following pattern:

```
signature = HMAC-SHA256(
    key: client_secret,
    message: client_id + meeting_uuid + rtms_stream_id
)
```

The `client_secret` and other credentials can be found in `data/rtms_credentials.json`.

**Handshake Response (Mock Server → Client):**

The media urls are returned in the handshake response if the handshake is successful:

```json
{
  "msg_type": "SIGNALING_HAND_SHAKE_RESP",
  "status": "STATUS_OK",
  "media_urls": {
    "all": "ws://localhost:8081/all",
    "video": "ws://localhost:8081/video",
    "audio": "ws://localhost:8081/audio",
    "transcript": "ws://localhost:8081/transcript"
  }
}
```

The signaling socket will also send you the following messages:

**Keep-Alive Request (Mock Server → Client):**

```json
{
  "msg_type": "KEEP_ALIVE_REQ",
  "timestamp": 1234567890
}
```

**Keep-Alive Response (Client → Mock Server):**

```json
{
  "msg_type": "KEEP_ALIVE_RESP",
  "timestamp": 1234567890
}
```

If you miss three consecutive keep-alive requests, the connection will be closed.

**Session State Update:**

```json
{
  "msg_type": "SESSION_STATE_UPDATE",
  "state": "STARTED", // or "PAUSED", "RESUMED", "STOPPED"
  "stop_reason": "reason",
  "timestamp": 1234567890
}
```

#### Media WebSocket Messages:

When you open a websocket connection wtih the media URLs you need to send the following handshake request:

```json
{
  "msg_type": "DATA_HAND_SHAKE_REQ",
  "protocol_version": 1,
  "meeting_uuid": "meeting_uuid",
  "rtms_stream_id": "stream_id",
  "signature": "hmac_sha256_signature",
  "payload_encryption": false
}
```

Note: The signature is generated using the same method as the signaling handshake.

The mock server will respond with the following message:

```json
{
  "msg_type": "DATA_HAND_SHAKE_RESP",
  "status": "STATUS_OK"
}
```

The media websocket will send you the following messages depending on which media type you are subscribed to:

**Video Data Format:**

```json
{
  "msg_type": "MEDIA_DATA_VIDEO",
  "content": {
    "user_id": 0,
    "data": "base64_encoded_video_frame",
    "timestamp": 1234567890
  }
}
```

**Audio Data Format:**

```json
{
  "msg_type": "MEDIA_DATA_AUDIO",
  "content": {
    "user_id": 0,
    "data": "base64_encoded_audio_chunk",
    "timestamp": 1234567890
  }
}
```

**Transcript Data Format:**

```json
{
  "msg_type": "MEDIA_DATA_TRANSCRIPT",
  "content": {
    "user_id": 0,
    "data": "transcribed text",
    "timestamp": 1234567890
  }
}
```

## License

See LICENSE.md file for details.

## Support

For questions or help needed, join us on the [Realtime Media Streams category](https://devforum.zoom.us/c/rtms) on the Zoom Developer Forum. If you need access to this, please reach out in your Zoom Team Chat channel.

Developer Forum thread: [Realtime Media Streams Mock Server](https://devforum.zoom.us/t/realtime-media-streams-mock-server)