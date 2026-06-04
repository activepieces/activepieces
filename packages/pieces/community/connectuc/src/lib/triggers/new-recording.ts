import { createTrigger, TriggerStrategy, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { registerConnectUCWebhook, unregisterConnectUCWebhook } from '../common/webhook-helpers';
import { domainProp, usersProp } from '../common/props';

export const newRecording = createTrigger({
    auth: connectucAuth,
    name: 'newRecording',
    displayName: 'New Recording',
    description: 'Triggers when a new call recording is available',
    props: {
        domain: domainProp(),
        users: usersProp(),
    },
    sampleData: {
        dateTime: '2025-11-06T14:07:59.000Z',
        duration: '20',
        unread: true,
        mediaUrl: 'https://api.example.com/users/36090f86-ea3d-566e-b97d-6a68999d416a/recordings/eyJ0ZXJtQ2FsbGlkIjoiOGMwc3BudmJmcjhnbHRncWZzZW8iLCJvcmlnQ2FsbGlkIjoiOGMwc3BudmJmcjhnbHRncWZzZW8ifQ==/url',
        origCallid: '8c0spnvbfr8gltgqfseo',
        recordingId: 'eyJ0ZXJtQ2FsbGlkIjoiOGMwc3BudmJmcjhnbHRncWZzZW8iLCJvcmlnQ2FsbGlkIjoiOGMwc3BudmJmcjhnbHRncWZzZW8ifQ==',
        recordingType: 'audio',
        download_url: 'https://api.example.com/users/36090f86-ea3d-566e-b97d-6a68999d416a/recordings/eyJ0ZXJtQ2FsbGlkIjoiOGMwc3BudmJmcjhnbHRncWZzZW8iLCJvcmlnQ2FsbGlkIjoiOGMwc3BudmJmcjhnbHRncWZzZW8ifQ==/url',
        domain: 'test.11111.service',
        user: '101',
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
        const auth = context.auth as OAuth2PropertyValue;

        await registerConnectUCWebhook({
            auth: {
                access_token: auth.access_token,
            },
            webhookUrl: context.webhookUrl,
            event: 'RecordingCreated',
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
