import { createTrigger, TriggerStrategy, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { registerConnectUCWebhook, unregisterConnectUCWebhook } from '../common/webhook-helpers';
import { domainProp, usersProp } from '../common/props';

export const newVoicemail = createTrigger({
    auth: connectucAuth,
    name: 'newVoicemail',
    displayName: 'New Voicemail',
    description: 'Triggers when a new voicemail is received',
    props: {
        domain: domainProp(),
        users: usersProp(),
    },
    sampleData: {
        id: "vm-20251106141508017931-7e6c15a2661d06d7d0281ecd502b4679",
        contactId: null,
        dateTime: "2025-11-06T14:15:37.000000Z",
        duration: 6,
        label: "(786) 288-1234",
        tel: "17862881234",
        read: false,
        transcription: null,
        filename: "vm-20251106141508017931-7e6c15a2661d06d7d0281ecd502b4679.wav",
        forwarded: null,
        type: "vmail/new",
        shared_uuid: null,
        remotepath: "https://www.test.com"
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
        const auth = context.auth as OAuth2PropertyValue;

        await registerConnectUCWebhook({
            auth: {
                access_token: auth.access_token,
            },
            webhookUrl: context.webhookUrl,
            event: 'NewVoicemail',
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
