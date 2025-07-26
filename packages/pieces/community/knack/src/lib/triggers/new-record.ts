import { createTrigger, Property, TriggerStrategy } from '@activepieces/framework';
import { knackAuth } from '../auth';
import { makeClient } from '../client';

export const newRecord = createTrigger({
    name: 'new_record',
    displayName: 'New Record',
    description: 'Triggers when a new record is created via API or app',
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
            description: 'How often to check for new records (in seconds)',
            defaultValue: 300,
            required: true,
        }),
    },
    sampleData: {
        "id": "5f7c3b6d8e9f4c1234567890",
        "field_1": "Sample data",
        "created": "2025-07-25T10:30:00.000Z"
    },
    async test(context) {
        const client = makeClient(context.auth);
        const response = await client.get(`/objects/${context.propsValue.objectKey}/records`, {
            params: {
                limit: 1,
                sort_field: "created",
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
                sort_field: "created",
                sort_order: "desc"
            }
        });
        
        if (response.data.records?.length > 0) {
            const latestRecord = response.data.records[0];
            context.store.put('lastCreatedTime', latestRecord.created);
        }
    },
    async run(context) {
        const client = makeClient(context.auth);
        const lastCreatedTime = await context.store.get('lastCreatedTime');
        
        const response = await client.get(`/objects/${context.propsValue.objectKey}/records`, {
            params: {
                limit: 100,
                sort_field: "created",
                sort_order: "desc",
                filters: lastCreatedTime ? {
                    created: {
                        $gt: lastCreatedTime
                    }
                } : undefined
            }
        });

        const records = response.data.records || [];
        
        if (records.length > 0) {
            await context.store.put('lastCreatedTime', records[0].created);
        }

        return records;
    },
});
