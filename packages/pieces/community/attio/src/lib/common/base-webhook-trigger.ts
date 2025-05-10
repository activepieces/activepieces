import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { attioAuth } from '../..';
import { WebhookData, WebhookFilterCondition, createWebhook, deleteWebhook, verifyWebhookSignature } from './webhook-utils';

/**
 * Creates a base Attio webhook trigger with common functionality
 */
export function createAttioWebhookTrigger({
    name,
    displayName,
    description,
    eventType,
    sampleData,
    props,
    getFilterConditions,
}: {
    name: string;
    displayName: string;
    description: string;
    eventType: string;
    sampleData: unknown;
    props: Record<string, any>;
    getFilterConditions: (propsValue: Record<string, unknown>) => WebhookFilterCondition[];
}) {
    return createTrigger({
        auth: attioAuth,
        name,
        displayName,
        description,
        props,
        sampleData,
        type: TriggerStrategy.WEBHOOK,
        async onEnable(context) {
            const { auth, webhookUrl, store, propsValue } = context;
            
            // Get filter conditions based on the props
            const filterConditions = getFilterConditions(propsValue);
            
            // Create webhook subscription
            const webhookData = await createWebhook({
                auth,
                webhookUrl,
                eventType,
                filterConditions,
            });
            
            // Store webhook data for later use
            await store.put('webhook', webhookData);
        },
        async onDisable(context) {
            const { auth, store } = context;
            
            // Retrieve webhook details
            const webhook = await store.get<WebhookData>('webhook');
            
            if (webhook) {
                await deleteWebhook({
                    auth,
                    webhookId: webhook.id,
                });
            }
        },
        async run(context) {
            const { payload, store } = context;
            const body = payload.body;
            const headers = payload.headers as Record<string, string>;
            
            // Verify webhook signature
            const webhook = await store.get<WebhookData>('webhook');
            
            if (webhook) {
                const signature = headers['attio-signature'] || headers['x-attio-signature'];
                
                const isValid = verifyWebhookSignature({
                    secret: webhook.secret,
                    signature,
                    body,
                });
                
                if (!isValid) {
                    console.error('Invalid webhook signature');
                    return [];
                }
            }
            
            // Return the payload data
            return [body];
        },
    });
} 