import { createTrigger } from '@activepieces/pieces-framework';
import { zohoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const unsubscribe = createTrigger({
    name: 'unsubscribe',
    displayName: 'Unsubscribe',
    description: 'Triggers when a contact is removed from a mailing list or unsubscribed',
    props: {
        listKey: {
            type: 'string',
            displayName: 'Mailing List Key',
            required: true,
        },
    },
    sampleData: {
        "email": "example@email.com",
        "listKey": "abc123",
        "unsubscribeTime": "2023-09-07T10:00:00Z",
        "reason": "User request"
    },
    type: 'polling',
    async test(context) {
        const response = await zohoCommon.makeRequest({
            auth: context.auth,
            method: HttpMethod.GET,
            path: `/unsubscribes?resfmt=JSON&listkey=${context.propsValue.listKey}`,
        });

        return response.data?.slice(0, 1) ?? [];
    },
    async run(context) {
        const response = await zohoCommon.makeRequest({
            auth: context.auth,
            method: HttpMethod.GET,
            path: `/unsubscribes?resfmt=JSON&listkey=${context.propsValue.listKey}`,
        });

        return response.data ?? [];
    },
    async onEnable(context) {
        context.store.put('lastCheck', new Date().toISOString());
    },
    async onDisable() {
        // Clean up if needed
    },
});
