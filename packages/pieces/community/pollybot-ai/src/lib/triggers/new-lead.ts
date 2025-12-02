import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { pollybotAuth } from '../auth';
import { pollybotCommon, baseUrl } from '../common/common';
import * as crypto from 'crypto';

// New interfaces for improved type safety (replacing 'any')
interface PollyBotLeadData {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    message?: string;
    status?: string;
    customFields?: Record<string, unknown>;
    chatbotId?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface PollyBotWebhookPayload {
    event?: 'LEAD_CREATED' | string;
    timestamp?: string;
    data?: PollyBotLeadData;
}

interface WebhookInformation {
    webhookId: string;
    secret: string; // Storing the secret returned by PollyBot during subscription
}

/**
 * Verify HMAC SHA256 signature from PollyBot webhook
 */
const verifyWebhookSignature = (rawBody: string, signature: string | undefined, secret: string | undefined): boolean => {
    if (!secret || !signature) {
        return false;
    }

    // Calculate expected signature
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

    // Extract received signature (remove 'sha256=' prefix if present)
    const receivedSignature = signature.replace("sha256=", "");

    // Use timing-safe comparison
    try {
        // Perform timing-safe comparison on buffers
        return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(receivedSignature, "hex")
        );
    } catch {
        return false;
    }
};

export const newLead = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    auth: pollybotAuth,
    name: 'new_lead',
    displayName: 'New Lead',
    description: 'Triggers when a new lead is created in your PollyBot chatbot.',
    props: {},
    type: TriggerStrategy.WEBHOOK,
    // Sample data matching your Zapier sample
    sampleData: {
        id: 'lead_1234567890abcdef',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'Acme Corp',
        message: 'Interested in your services',
        status: 'NEW',
        customFields: {
        budget: '10000',
        timeline: 'Q1 2024',
        },
        chatbotId: 'clp123chatbot456',
        createdAt: '2023-11-04T15:30:56.789Z',
    },

    async onEnable(context) {
        // pollybotCommon.subscribeWebhook now returns { webhookId: string, secret: string }
        const { webhookId, secret } = await pollybotCommon.subscribeWebhook(
            context.auth.chatbotId,
            context.auth.apiKey,
            context.webhookUrl
        );

        await context.store?.put<WebhookInformation>('_new_lead_trigger', {
            webhookId: webhookId,
            secret: secret, // Store the secret for later signature verification
        });
    },

    async onDisable(context) {
        const response = await context.store?.get<WebhookInformation>(
            '_new_lead_trigger'
        );

        if (response !== null && response !== undefined) {
            try {
                await pollybotCommon.unsubscribeWebhook(
                    context.auth.chatbotId,
                    context.auth.apiKey,
                    response.webhookId
                );
            } catch (e) {
                // Ignore errors during unsubscribe (e.g. if webhook was already deleted)
                console.warn('Failed to unsubscribe webhook:', e);
            }
        }
    },

    
    async test(context) {
        try {
            const response = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${baseUrl}/chatbots/${context.auth.chatbotId}/leads`,
                headers: {
                    Authorization: `Bearer ${context.auth.apiKey}`,
                },
                queryParams: {
                    limit: '3',
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                }
            });

            const data = response.body.data || response.body;
            const leads = Array.isArray(data.leads) ? data.leads : (Array.isArray(data) ? data : []);
            
            return leads;
        } catch (e) {
            throw new Error(`Failed to fetch test sample: ${e}`);
        }
    },

    async run(context) {
        const payload = context.payload.body as PollyBotWebhookPayload;

        // 1. Retrieve Secret
        // Note: The `secret` property exists on `WebhookInformation`, so this is correct.
        const webhookInfo = await context.store?.get<WebhookInformation>(
            '_new_lead_trigger'
        );
        const secret = webhookInfo?.secret;

        // 2. Signature Verification (Crucial security step matching Zapier logic)
        // PollyBot sends the signature in 'X-Webhook-Signature' header
        const signature = context.payload.headers['x-webhook-signature'] as
            | string
            | undefined;
        const rawBody = context.payload.rawBody;

        // Fix: Explicitly check if rawBody is a string to satisfy TypeScript compiler
        if (secret && signature && typeof rawBody === 'string') {
            const isValid = verifyWebhookSignature(rawBody, signature, secret);

            if (!isValid) {
                // Log the failure but return empty array to prevent unauthorized data from passing
                console.error('Invalid webhook signature detected!');
                return [];
            }
        } else {
            console.warn(
                'Webhook signature verification skipped (secret or signature header missing or raw body not available)'
            );
        }

        // 3. Verify Payload Structure and Event Type
        if (payload.event !== 'LEAD_CREATED' || !payload.data) {
            // Ignore unexpected events or missing data
            return [];
        }

        // 4. Return Lead Data
        return [payload.data];
    },
});
