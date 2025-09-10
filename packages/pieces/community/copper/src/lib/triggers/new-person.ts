import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from "@activepieces/pieces-common";
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

import { copperAuth } from '../common/auth';

const polling: Polling<PiecePropValueSchema<typeof copperAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        const response = await httpClient.sendRequest<any[]>({
            method: HttpMethod.POST,
            url: `https://api.copper.com/developer_api/v1/people/search`,
            headers: {
                'X-PW-AccessToken': auth.token,
                'X-PW-UserEmail': auth.email,
                'X-PW-Application': 'developer_api',
                'Content-Type': 'application/json',
            },
            body: {
                page_size: 200,
                sort_by: "date_created",
                sort_direction: "asc",
                minimum_created_date: Math.floor(lastFetchEpochMS / 1000),
            }
        });
        
        return response.body.map((item) => ({
            epochMilliSeconds: item.date_created * 1000,
            data: item,
        }));
    }
};

export const newPerson = createTrigger({
    name: 'new_person',
    auth: copperAuth,
    displayName: 'New Person',
    description: 'Fires when a new person/contact is created.',
    props: {},
    type: TriggerStrategy.POLLING,
    sampleData: {
        "id": 123456,
        "name": "John Doe",
        "assignee_id": 7890,
        "company_id": 11223,
        "company_name": "Example Corp",
        "contact_type_id": 1,
        "details": "A new contact from the API.",
        "emails": [{ "email": "john.doe@example.com", "category": "work" }],
        "phone_numbers": [],
        "address": {},
        "socials": [],
        "tags": ["api-test"],
        "title": "Software Engineer",
        "websites": [],
        "date_created": 1678886400,
        "date_modified": 1678886400,
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