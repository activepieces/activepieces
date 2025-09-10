import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from "@activepieces/pieces-common";
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

import { copperAuth } from '../common/auth';

const polling: Polling<PiecePropValueSchema<typeof copperAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        const response = await httpClient.sendRequest<any[]>({
            method: HttpMethod.POST,
            url: `https://api.copper.com/developer_api/v1/tasks/search`,
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

export const newTask = createTrigger({
    name: 'new_task',
    auth: copperAuth,
    displayName: 'New Task',
    description: 'Fires when a new task is created.',
    props: {},
    type: TriggerStrategy.POLLING,
    sampleData: {
        "id": 12345,
        "name": "Follow up with John Doe",
        "assignee_id": 67890,
        "due_date": 1679886400,
        "priority": "High",
        "status": "Open",
        "details": "Call John to discuss the proposal.",
        "date_created": 1678886400,
        "date_modified": 1678886400,
        "related_resource": { "id": 11223, "type": "person" }
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