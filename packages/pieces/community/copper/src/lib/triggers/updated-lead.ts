import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from "@activepieces/pieces-common";
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

import { copperAuth } from '../common/auth';

const polling: Polling<PiecePropValueSchema<typeof copperAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        const response = await httpClient.sendRequest<any[]>({
            method: HttpMethod.POST,
            url: `https://api.copper.com/developer_api/v1/leads/search`,
            headers: {
                'X-PW-AccessToken': auth.token,
                'X-PW-UserEmail': auth.email,
                'X-PW-Application': 'developer_api',
                'Content-Type': 'application/json',
            },
            body: {
                page_size: 200,
                sort_by: "date_modified",
                sort_direction: "asc",
                minimum_modified_date: Math.floor(lastFetchEpochMS / 1000),
            }
        });
        
        return response.body.map((item) => ({
            epochMilliSeconds: item.date_modified * 1000,
            data: item,
        }));
    }
};

export const updatedLead = createTrigger({
    name: 'updated_lead',
    auth: copperAuth,
    displayName: 'Updated Lead',
    description: 'Fires when a lead is modified.',
    props: {},
    type: TriggerStrategy.POLLING,
    sampleData: {
        "id": 12345,
        "name": "Updated Website Lead",
        "assignee_id": 67890,
        "company_name": "Web Co.",
        "customer_source_id": 11223,
        "details": "Updated the contact form submission details.",
        "email": { "email": "contact@web.co", "category": "work" },
        "status_id": 2, // Status updated
        "title": "Senior Marketing Manager", // Title updated
        "date_created": 1678886400,
        "date_modified": 1678999999, // Modified date is newer
    },

    async onEnable(context) {
        await pollingHelper.onEnable(polling, context);
    },

    async onDisable(context) {
        await pollingHelper.onDisable(polling, context);
    },

    async run(context) {
        return await pollingHelper.poll(polling, context);
    },

    async test(context) {
        return await pollingHelper.test(polling, context);
    },
});