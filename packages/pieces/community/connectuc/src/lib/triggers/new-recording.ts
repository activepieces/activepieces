import { createTrigger, TriggerStrategy, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { registerConnectUCWebhook, unregisterConnectUCWebhook } from '../common/webhook-helpers';

const TRIGGER_KEY = 'connectuc_new_recording_webhook';
const BASE_URL = 'https://staging.connectuc.engineering/activepieces';

export const newRecording = createTrigger({
    auth: connectucAuth,
    name: 'newRecording',
    displayName: 'New Recording',
    description: 'Triggers when a new call recording is available',
    props: {
        users: Property.LongText({
            displayName: 'Users',
            description: 'Add comma-separated users to which this trigger applies',
            required: false,
        }),
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
            triggerKey: TRIGGER_KEY,
            baseUrl: BASE_URL,
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
            triggerKey: TRIGGER_KEY,
            baseUrl: BASE_URL,
        });
    },
    async run(context){
        return [context.payload.body]
    }
})
