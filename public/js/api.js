class APIHandler {
    static async validateWebhook() {
        try {
            const webhookUrl = document.getElementById("webhookUrl").value;
            UIController.addSystemLog('Webhook', 'Validation request sent', { url: webhookUrl });

            const response = await fetch("/api/validate-webhook", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ webhookUrl }),
            });

            const data = await response.json();

            if (data.success) {
                UIController.addSystemLog('Webhook', 'Validation successful');
                // Enable the start meeting button
                document.getElementById("sendBtn").disabled = false;
                // Store the validated URL for later use
                window.validatedWebhookUrl = webhookUrl;
            } else {
                UIController.addSystemLog('Webhook', 'Validation failed', { error: data.error });
                document.getElementById("sendBtn").disabled = true;
                window.validatedWebhookUrl = null;
            }
        } catch (error) {
            console.error("Validation error:", error);
            UIController.addSystemLog('Webhook', 'Validation error', { error: error.message });
            document.getElementById("sendBtn").disabled = true;
            window.validatedWebhookUrl = null;
        }
    }

    static async sendWebhook(isNewMeeting = true) {
        try {
            const webhookUrl = window.validatedWebhookUrl || document.getElementById("webhookUrl").value;
            UIController.addSignalingLog('Sending Meeting Start Request', { webhookUrl });

            // Always send through our server endpoint
            const response = await fetch("/api/send-webhook", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    webhookUrl,
                    isNewMeeting,
                    existingPayload: isNewMeeting ? null : window.lastWebhookPayload 
                }),
            });

            const data = await response.json();
            
            if (data.success) {
                if (isNewMeeting) {
                    // Store the successful payload for future RTMS starts
                    window.lastWebhookPayload = data.sent;
                }
                await this.handleWebhookResponse(data, webhookUrl);
            } else {
                throw new Error(data.error || "Failed to get webhook payload");
            }
        } catch (error) {
            UIController.addSignalingLog('Meeting Start Error', { error: error.message });
            console.error("Send webhook error:", error);
            document.getElementById("sendBtn").disabled = true;
        }
    }

    static async handleWebhookResponse(payload, webhookUrl) {
        if (payload.success && payload.sent?.payload?.payload?.object?.server_urls) {
            UIController.addSignalingLog('Meeting Start Success', {
                server_urls: payload.sent.payload.payload.object.server_urls
            });
            await MediaHandler.startMediaStream(payload.sent.payload.payload.object.server_urls);
        } else {
            UIController.addSignalingLog('Meeting Start Failed', payload);
            document.getElementById("sendBtn").disabled = true;
        }
    }
} 