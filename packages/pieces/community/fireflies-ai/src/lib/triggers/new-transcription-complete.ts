import { createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import crypto from 'node:crypto';
import { firefliesAiAuth } from "../../index";

interface FirefliesWebhookPayload {
    meetingId: string;       // Transcript ID
    eventType: string;       // e.g., "Transcription completed"
    clientReferenceId?: string;
}

const FIREFLIES_EVENT_TRANSCRIPTION_COMPLETED = "Transcription completed";

export const newTranscriptionComplete = createTrigger({
    name: 'new_transcription_complete',
    displayName: 'New Transcription Complete',
    description: 'Triggers when a new meeting transcription is completed in Fireflies.ai.',
    auth: firefliesAiAuth,
    props: {
        webhookSecret: Property.ShortText({
            displayName: 'Webhook Secret Key (Optional)',
            description: 'The secret key configured in your Fireflies.ai Developer settings for webhook signature verification. Ensures requests are from Fireflies.ai.',
            required: false,
        })
    },
    sampleData: {
        meetingId: "ASxwZxCstx",
        eventType: "Transcription completed",
        clientReferenceId: "be582c46-4ac9-4565-9ba6-6ab4264496a8"
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        // Instruct user to configure this webhook URL in Fireflies.ai Developer settings
        // And to set up the secret key there if they provided one here.
        if (context.propsValue.webhookSecret) {
            await context.store.put('fireflies_webhook_secret', context.propsValue.webhookSecret);
        }
        console.log(`Webhook URL: ${context.webhookUrl}`);
        // No API call to Fireflies to register the webhook, user does it manually.
    },
    async onDisable(context) {
        // Instruct user to manually remove the webhook from Fireflies.ai settings.
        await context.store.delete('fireflies_webhook_secret');
        console.log(`Webhook URL ${context.webhookUrl} disabled. Please remove it from Fireflies.ai Developer settings.`);
    },
    async run(context) {
        const payload = context.payload.body as FirefliesWebhookPayload;
        const signatureFromHeader = context.payload.headers['x-hub-signature'] as string | undefined;
        const storedSecret = await context.store.get<string>('fireflies_webhook_secret');

        if (storedSecret) {
            if (!signatureFromHeader) {
                console.warn('Webhook secret was provided, but no x-hub-signature header found in the request. Rejecting.');
                return [];
            }

            if (!signatureFromHeader.startsWith('sha256=')) {
                console.error('Webhook signature format is invalid (missing sha256= prefix). Rejecting.');
                return [];
            }

            const receivedHash = signatureFromHeader.substring(7); // Extract hash part
            const computedHash = crypto
                .createHmac('sha256', storedSecret)
                .update(JSON.stringify(context.payload.body))
                .digest('hex');

            try {
                // Ensure buffers are created safely
                const receivedHashBuffer = Buffer.from(receivedHash, 'hex');
                const computedHashBuffer = Buffer.from(computedHash, 'hex');

                if (receivedHashBuffer.length !== computedHashBuffer.length) {
                    console.error('Webhook signature hash length mismatch. Rejecting.');
                    return [];
                }

                if (!crypto.timingSafeEqual(receivedHashBuffer, computedHashBuffer)) {
                    console.error('Webhook signature verification failed. Rejecting.');
                    return [];
                }
            } catch (error) {
                console.error('Error during signature comparison (e.g., invalid hex string). Rejecting.', error);
                return [];
            }
            // If we reach here, signature is valid and verified.
        }
        // If storedSecret is not present, we skip verification (as it's an optional feature for the user).

        if (payload.eventType === FIREFLIES_EVENT_TRANSCRIPTION_COMPLETED) {
            return [payload];
        }
        return [];
    },
});
