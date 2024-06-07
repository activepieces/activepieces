import { krispcallAuth } from '../../index';
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { TriggerStrategy, createTrigger } from "@activepieces/pieces-framework"

export const triggers = [
    {
        name: 'newVoicemail',
        displayName: 'New Voicemail',
        description: 'Trigger when a new voicemail is received.',
        action: 'new_voicemail',
        sampleData: {
            id: '',
            from: '+9779821110987',
            duration: '5 seconds',
            call_time: '2000-10-31T01:30:00.000-05:00',
            voicemail_audio: 'voicemail.mp4',
        },
    },
    {
        name: 'newMms',
        displayName: 'New MMS',
        description: 'Trigger when a new MMS is received.',
        action: 'new_sms_or_mms',
        sampleData: {},
    },
    {
        name: 'newContact',
        displayName: 'New Contact',
        description: 'Trigger when a new contact is added.',
        action: 'new_contact',
        sampleData: {
            id: '1',
            email: 'john@example.com',
            company: 'KrispCall',
            address: 'Singapore',
            name: 'John Smith',
            contactNumber: '+9779834509123',
        },
    }
].map(trigger => {
    return createTrigger({
        name: trigger.name,
        displayName: trigger.displayName,
        auth: krispcallAuth,
        description: trigger.description,
        props: {},
        sampleData: trigger.sampleData,
        type: TriggerStrategy.WEBHOOK,
        async onEnable(context) {
            const response = await httpClient.sendRequest({
                method: HttpMethod.POST,
                url: 'https://automationapi.krispcall.com/api/v1/platform/activepiece/subscribe',
                body: {
                    hookUrl: context.webhookUrl,
                    action: trigger.action,
                },
                headers: {
                    'X-API-KEY': context.auth.apiKey,
                },
            });
            await context.store.put('_webhook_id', response.body.id);
        },
        async onDisable(context) {
            const webhookId = await context.store.get<string>('_webhook_id');
            await httpClient.sendRequest({
                method: HttpMethod.DELETE,
                url: 'https://automationapi.krispcall.com/api/v1/platform/activepiece/unsubscribe',
                body: {
                    hookUrl: webhookId,
                },
                headers: {
                    'X-API-KEY': context.auth.apiKey,
                },
            });
        },
        async run(context) {
            return [context.payload.body];
        },
    })
})