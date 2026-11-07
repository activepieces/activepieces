import { createTrigger, TriggerStrategy, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { registerConnectUCWebhook, unregisterConnectUCWebhook } from '../common/webhook-helpers';
import { domainProp, userProp, smsRecipientsProp } from '../common/props';

export const newSms = createTrigger({
    auth: connectucAuth,
    name: 'newSms',
    classification: 'READ',
    displayName: 'New SMS',
    description: 'Triggers when a text is received or sent.',
    aiMetadata: {
        description: 'Fires when a new SMS/MMS message is sent or received (configurable via Direction) for the selected ConnectUC domain, user, and recipient numbers. Represents a text with its content, sender, recipients, direction, and any media attachments.'
    },
    props: {
        domain: domainProp(),
        users: userProp(),
        recipients: smsRecipientsProp(),
        direction: Property.StaticDropdown({
            displayName: 'Direction',
            description: 'Which texts start the flow.',
            required: true,
            display: 'cards',
            options: {
                options: [
                    { label: 'Incoming', value: 'incoming', description: 'Texts you receive', icon: 'inbox' },
                    { label: 'Outgoing', value: 'outgoing', description: 'Texts you send', icon: 'send' },
                    { label: 'Both', value: '*', description: 'Sent and received', icon: 'reply-all' },
                ],
            },
            defaultValue: 'incoming',
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
