import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from "@activepieces/pieces-common";
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

import { copperAuth } from '../common/auth';
import { copperProps } from '../common/props';

const polling: Polling<
    PiecePropValueSchema<typeof copperAuth>, 
    { pipeline_id: string | undefined }
> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const body: Record<string, unknown> = {
            page_size: 200,
            sort_by: "date_modified",
            sort_direction: "asc",
            minimum_modified_date: Math.floor(lastFetchEpochMS / 1000),
        };

        if (propsValue.pipeline_id) {
            body['pipeline_ids'] = [propsValue.pipeline_id];
        }

        const response = await httpClient.sendRequest<any[]>({
            method: HttpMethod.POST,
            url: `https://api.copper.com/developer_api/v1/opportunities/search`,
            headers: {
                'X-PW-AccessToken': auth.token,
                'X-PW-UserEmail': auth.email,
                'X-PW-Application': 'developer_api',
                'Content-Type': 'application/json',
            },
            body: body
        });
        
        return response.body.map((item) => ({
            epochMilliSeconds: item.date_modified * 1000,
            data: item,
        }));
    }
};

export const updatedOpportunity = createTrigger({
    name: 'updated_opportunity',
    auth: copperAuth,
    displayName: 'Updated Opportunity',
    description: 'Fires when an opportunity changes.',
    props: {
        pipeline_id: copperProps.optionalPipelineId,
    },
    type: TriggerStrategy.POLLING,
    sampleData: {
        "id": 12345,
        "name": "Big Project Q4",
        "assignee_id": 67890,
        "company_id": 11223,
        "customer_source_id": 44556,
        "details": "Initial details of the project opportunity.",
        "loss_reason_id": null,
        "pipeline_id": 77889,
        "pipeline_stage_id": 99001,
        "primary_contact_id": 22334,
        "priority": "High",
        "status": "Open",
        "tags": ["q4", "enterprise"],
        "date_created": 1678886400,
        "date_modified": 1678999999,
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