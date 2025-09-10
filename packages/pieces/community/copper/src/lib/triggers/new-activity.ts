import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from "@activepieces/pieces-common";
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

import { copperAuth } from '../common/auth';
import { copperProps } from '../common/props';

// 👇 Corrected Polling Strategy and Types
const polling: Polling<
    PiecePropValueSchema<typeof copperAuth>, 
    { activity_type: string | undefined }
> = {
    
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const activity_type = propsValue.activity_type;

        const body: Record<string, unknown> = {
            page_size: 200,
            minimum_activity_date: Math.floor(lastFetchEpochMS / 1000), // Convert ms to seconds
        };

        if (activity_type) {
            const activityTypeObject = JSON.parse(activity_type as string);
            body['activity_types'] = [activityTypeObject];
        }

        const response = await httpClient.sendRequest<any[]>({
            method: HttpMethod.POST,
            url: `https://api.copper.com/developer_api/v1/activities/search`,
            headers: {
                'X-PW-AccessToken': auth.token,
                'X-PW-UserEmail': auth.email,
                'X-PW-Application': 'developer_api',
                'Content-Type': 'application/json',
            },
            body: body
        });
        
        
        return response.body.map((item) => ({
            
            epochMilliSeconds: item.activity_date * 1000,
            data: item,
        }));
    }
};

export const newActivity = createTrigger({
    name: 'new_activity',
    auth: copperAuth,
    displayName: 'New Activity',
    description: 'Fires when a new activity is logged (e.g., call, email, note).',
    props: {
        activity_type: copperProps.optionalActivityTypeId,
    },
    type: TriggerStrategy.POLLING,
    sampleData: {
        "id": 12345,
        "parent": { "type": "person", "id": 67890 },
        "type": { "category": "user", "id": 0 },
        "user_id": 54321,
        "details": "This is a sample note.",
        "activity_date": 1678886400,
        "date_created": 1678886400,
        "date_modified": 1678886400
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