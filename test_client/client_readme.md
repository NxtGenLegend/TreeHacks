# Zoom RTMS Client

A client to test the RTMS Mock Server. This client connects to the RTMS Mock Server and sends messages to it.

## Overview

This client:
- Listens for Zoom webhook events
- Handles RTMS connection initialization
- Manages WebSocket connections for both signaling and media data
- Processes real-time media streams from RTMS Mock Server

## Prerequisites

- Node.js (v14 or higher)
- npm
- A Zoom account with RTMS enabled
- RTMS credentials (stored in `data/rtms_credentials.json`)

## Setup

1. Install dependencies:
```

## Using ngrok for Webhook Testing

To receive webhooks from the RTMS Mock Server, your client needs to be publicly accessible. ngrok is a useful tool for this:

1. Install ngrok from [https://ngrok.com/download](https://ngrok.com/download)

2. Start ngrok on port 8000:
```bash
ngrok http 8000
```

3. Copy the generated HTTPS URL (e.g., `https://abc123.ngrok.io`)

4. Use this URL as your webhook endpoint in the RTMS Mock Server UI

Note: The ngrok URL changes each time you restart ngrok unless you have a paid account.

## How It Works

1. The client starts an Express server on port 8000 to receive Zoom webhooks
2. When a meeting (session) is started in RTMS Mock Server:
   - Mock server sends a webhook to the client
   - Client establishes a signaling WebSocket connection
   - After successful handshake, connects to media WebSocket
   - Begins receiving real-time media data



## Limitations

This is a minimal implementation focused on core functionality. For production use, consider adding:
- Data processing