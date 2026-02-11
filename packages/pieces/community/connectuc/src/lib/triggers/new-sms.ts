import { createTrigger, TriggerStrategy, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { registerConnectUCWebhook, unregisterConnectUCWebhook } from '../common/webhook-helpers';

export const newSms = createTrigger({
    auth: connectucAuth,
    name: 'newSms',
    displayName: 'New SMS',
    description: 'Triggers when a new SMS message is received',
    props: {
        recipients: Property.LongText({
            displayName: 'Recipients',
            description: 'Add comma-separated recipients to which this trigger applies',
            required: false,
        }),
    },
    sampleData: {
        conversationId: 1234567,
        messageId: "i123456789",
        referenceId: "01ABC123DEF456GHI789JKL012",
        type: "message",
        direction: "incoming",
        sender: "11234567890",
        recipients: ["11234567890"],
        content: "Test message from webhook",
        contentType: "text/plain",
        disposition: "",
        options: "",
        createdTimestamp: "2025-12-04T14:48:55.000Z",
        updatedTimestamp: "",
        sentTimestamp: "",
        deliveredTimestamp: "",
        readTimestamp: "",
        media: []
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
        const auth = context.auth as OAuth2PropertyValue;

        await registerConnectUCWebhook({
            auth: {
                access_token: auth.access_token,
            },
            webhookUrl: context.webhookUrl,
            event: 'SMSMessageReceived',
            context,
        });
    },
    async onDisable(context){
        const auth = context.auth as OAuth2PropertyValue;

        await unregisterConnectUCWebhook({
            auth: {
                access_token: auth.access_token,
            },
            webhookUrl: context.webhookUrl,
            context,
        });
    },
    async run(context){
        return [context.payload.body]
    }
})
