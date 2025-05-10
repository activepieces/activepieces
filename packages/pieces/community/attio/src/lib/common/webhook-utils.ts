import { HttpRequest, HttpMethod, httpClient } from '@activepieces/pieces-common';
import crypto from 'crypto';

export type WebhookFilterCondition = {
    field: string;
    operator: 'equals' | 'not_equals';
    value: string;
};

export type WebhookData = {
    id: string;
    secret: string;
};

/**
 * Creates a webhook subscription in Attio
 */
export async function createWebhook({
    auth,
    webhookUrl,
    eventType,
    filterConditions = []
}: {
    auth: string;
    webhookUrl: string;
    eventType: string;
    filterConditions?: WebhookFilterCondition[];
}): Promise<WebhookData> {
    // Create the final filter object
    let filter = null;
    if (filterConditions.length > 0) {
        filter = {
            $and: filterConditions
        };
    }

    const request: HttpRequest = {
        method: HttpMethod.POST,
        url: 'https://api.attio.com/v2/webhooks',
        headers: {
            'Authorization': `Bearer ${auth}`,
            'Content-Type': 'application/json'
        },
        body: {
            target_url: webhookUrl,
            event_types: [eventType],
            filter: filter
        }
    };

    const response = await httpClient.sendRequest<WebhookData>(request);
    return response.body;
}

/**
 * Deletes a webhook subscription in Attio
 */
export async function deleteWebhook({
    auth,
    webhookId
}: {
    auth: string;
    webhookId: string;
}): Promise<void> {
    const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `https://api.attio.com/v2/webhooks/${webhookId}`,
        headers: {
            'Authorization': `Bearer ${auth}`
        }
    };
    
    await httpClient.sendRequest(request);
}

/**
 * Verifies the webhook signature
 */
export function verifyWebhookSignature({
    secret,
    signature,
    body
}: {
    secret: string;
    signature: string;
    body: unknown;
}): boolean {
    if (!signature || !secret) {
        return false;
    }

    const rawBody = JSON.stringify(body);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest('hex');
    
    return signature === expectedSignature;
} 