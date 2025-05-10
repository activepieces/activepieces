import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { isNil } from '@activepieces/shared';
import { campaignMonitorAuth } from '../../index';

export const newListTrigger = createTrigger({
    auth: campaignMonitorAuth,
    name: 'new_list',
    displayName: 'New List',
    description: 'Triggered when a new list is created',
    props: {
        clientId: Property.ShortText({
            displayName: 'Client ID',
            description: 'The ID of the client to watch for new lists',
            required: true,
        }),
    },
    type: TriggerStrategy.POLLING,
    sampleData: {
        "ListID": "a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1",
        "Title": "My New List"
    },
    async onEnable(context) {
        // Store the current timestamp to use as a starting point
        await context.store.put('last_check_time', { timestamp: new Date().toISOString() });
    },
    async onDisable(context) {
        // No cleanup needed for polling trigger
    },
    async run(context) {
        const { clientId } = context.propsValue;
        const lastCheckTime = await context.store.get<{ timestamp: string }>('last_check_time');
        const currentTime = new Date().toISOString();

        // Get all client lists
        const response = await makeRequest(
            { apiKey: context.auth as string },
            HttpMethod.GET,
            `/clients/${clientId}/lists.json`
        ) as Array<{ ListID: string, Name: string, CreatedDate: string }>;

        // Filter lists created since last check
        const newLists = response.filter(list => {
            return !lastCheckTime || new Date(list.CreatedDate) > new Date(lastCheckTime.timestamp);
        });

        // Update the last check time
        await context.store.put('last_check_time', { timestamp: currentTime });

        // Return new lists
        return newLists.map(list => ({
            ListID: list.ListID,
            Title: list.Name
        }));
    },
});
