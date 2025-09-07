import { createTrigger } from '@activepieces/pieces-framework';
import { zohoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const newContact = createTrigger({
    name: 'new_contact',
    displayName: 'New Contact',
    description: 'Triggers when a new contact is added to a selected mailing list',
    props: {
        listKey: {
            type: 'string',
            displayName: 'Mailing List Key',
            required: true,
        },
    },
    sampleData: {
        "id": "123456",
        "email": "example@email.com",
        "firstName": "John",
        "lastName": "Doe",
        "status": "active",
        "source": "manual",
        "createdTime": "2023-09-07T10:00:00Z"
    },
    type: 'polling',
    async test(context) {
        const response = await zohoCommon.makeRequest({
            auth: context.auth,
            method: HttpMethod.GET,
            path: `/getcontacts?resfmt=JSON&listkey=${context.propsValue.listKey}&fromIndex=0&range=10`,
        });

        return response.data?.slice(0, 1) ?? [];
    },
    async run(context) {
        const response = await zohoCommon.makeRequest({
            auth: context.auth,
            method: HttpMethod.GET,
            path: `/getcontacts?resfmt=JSON&listkey=${context.propsValue.listKey}&fromIndex=0&range=10`,
        });

        return response.data ?? [];
    },
    async onEnable(context) {
        // Store the current timestamp to use as a baseline for future checks
        context.store.put('lastCheck', new Date().toISOString());
    },
    async onDisable() {
        // Clean up if needed
    },
});
