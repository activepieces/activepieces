import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { chatbaseAuth } from '../../index';
import { LeadSubmitPayload, verifyWebhookSignature } from '../common/chatbase-api';

export const leadSubmitted = createTrigger({
    auth: chatbaseAuth,
    name: 'leadSubmitted',
    displayName: 'Lead Submitted',
    description: 'Triggers when a customer submits their information (Name, Email, and Phone) to your chatbot',
    props: {
        chatbotId: Property.ShortText({
            displayName: 'Chatbot ID',
            description: 'The ID of your chatbot',
            required: true,
        }),
    },
    sampleData: {
        eventType: 'leads.submit',
        chatbotId: 'xxxxxxxx',
        payload: {
            conversationId: 'xxxxxxxx',
            customerEmail: 'example@chatbase.co',
            customerName: 'Example',
            customerPhone: '123'
        }
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        // Webhook creation is handled by Activepieces
        return;
    },
    async onDisable(context) {
        // Webhook deletion is handled by Activepieces
        return;
    },
    async run(context) {
        const signature = context.payload.headers['x-chatbase-signature'];
        const rawBody = Buffer.from(JSON.stringify(context.payload.body));

        if (!verifyWebhookSignature(signature, rawBody, context.auth.apiKey)) {
            throw new Error('Invalid webhook signature');
        }

        const payload = context.payload.body as LeadSubmitPayload;
        
        // Only process leads.submit events
        if (payload.eventType !== 'leads.submit') {
            return [];
        }

        // Only process events for the specified chatbot
        if (payload.chatbotId !== context.propsValue.chatbotId) {
            return [];
        }

        return [payload];
    }
});