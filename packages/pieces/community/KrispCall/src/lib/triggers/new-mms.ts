import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { krispcallAuth } from '../..';
import {
    httpClient,
    HttpMethod,
    HttpRequest,
} from '@activepieces/pieces-common';
export const newMms = createTrigger({
    name: 'newMms',
    displayName: 'New MMS',
    auth: krispcallAuth,
    description: 'It trigger when new sms/mms arrive in user workspace.',
    props: {},
    sampleData: {},
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        // implement webhook creation logic
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: 'https://automationapi.krispcall.com/api/v1/platform/activepiece/subscribe',
            body: {
                'hookUrl': context.webhookUrl,
                'action': "new_sms_or_mms"
            },
            headers: {
                'X-API-KEY': context.auth.apiKey,
            },
        };
        const response = await httpClient.sendRequest(
            request
        );
        const id: string = response.body.id
        const key = `new_sms_or_mms`;
        await context.store.put(key, id);
    },
    async onDisable(context) {
        // implement webhook deletion logic
        const webhook_id = await context.store.get<string>(
            `new_sms_or_mms`
        );
        const request: HttpRequest = {
            method: HttpMethod.DELETE,
            url: 'https://automationapi.krispcall.com/api/v1/platform/activepiece/unsubscribe',
            body: {
                'hookUrl': webhook_id
            },
            headers: {
                'X-API-KEY': context.auth.apiKey,
            },
        };
        await httpClient.sendRequest(
            request
        );
    },
    async run(context) {
        return [context.payload.body]
    }
})











