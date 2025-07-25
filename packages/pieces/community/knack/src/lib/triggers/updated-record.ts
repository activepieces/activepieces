import { createTrigger, Property, TriggerStrategy } from '@activepieces/framework';
import { knackAuth } from '../auth';
import { makeClient } from '../client';

export const updatedRecord = createTrigger({
    name: 'updated_record',
    displayName: 'Updated Record',
    description: 'Triggers when an existing record is updated',
    type: TriggerStrategy.POLLING,
    auth: knackAuth,
    props: {
        objectKey: Property.ShortText({
            displayName: 'Object Key',
            description: 'The key of the object/table to monitor',
            required: true,
        }),
        pollingInterval: Property.Number({
            displayName: 'Polling Interval',
            description: 'How often to check for updated records (in seconds)',
            defaultValue: 300,
            required: true,
        }),
    },
    sampleData: {
        "id": "5f7c3b6d8e9f4c1234567890",
        "field_1": "Updated data",
        "updated": "2025-07-25T10:30:00.000Z"
    },
    async test(context) {
        const client = makeClient(context.auth);
        const response = await client.get(`/objects/${context.propsValue.objectKey}/records`, {
            params: {
                limit: 1,
                sort_field: "updated",
                sort_order: "desc"
            }
        });
        return response.data.records || [];
    },
    async onEnable(context) {
        const client = makeClient(context.auth);
        const response = await client.get(`/objects/${context.propsValue.objectKey}/records`, {
            params: {
                limit: 1,
                sort_field: "updated",
                sort_order: "desc"
            }
        });
        
        if (response.data.records?.length > 0) {
            const latestRecord = response.data.records[0];
            context.store.put('lastUpdateTime', latestRecord.updated);
        }
    },
    async run(context) {
        const client = makeClient(context.auth);
        const lastUpdateTime = await context.store.get('lastUpdateTime');
        
        const response = await client.get(`/objects/${context.propsValue.objectKey}/records`, {
            params: {
                limit: 100,
                sort_field: "updated",
                sort_order: "desc",
                filters: lastUpdateTime ? {
                    updated: {
                        $gt: lastUpdateTime
                    }
                } : undefined
            }
        });

        const records = response.data.records || [];
        
        if (records.length > 0) {
            await context.store.put('lastUpdateTime', records[0].updated);
        }

        return records;
    },
});
