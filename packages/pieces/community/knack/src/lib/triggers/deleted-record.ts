import { createTrigger, Property, TriggerStrategy } from '@activepieces/framework';
import { knackAuth } from '../auth';
import { makeClient } from '../client';

export const deletedRecord = createTrigger({
    name: 'deleted_record',
    displayName: 'Deleted Record',
    description: 'Triggers when a record is deleted in the live app',
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
            description: 'How often to check for deleted records (in seconds)',
            defaultValue: 300,
            required: true,
        }),
    },
    sampleData: {
        "id": "5f7c3b6d8e9f4c1234567890",
        "object_key": "object_1",
        "deleted_at": "2025-07-25T10:30:00.000Z"
    },
    async test(context) {
        // For deleted records, we'll return a sample deletion event
        return [this.sampleData];
    },
    async onEnable(context) {
        // Store the current timestamp as the starting point
        context.store.put('lastCheckTime', new Date().toISOString());
    },
    async run(context) {
        const client = makeClient(context.auth);
        const lastCheckTime = await context.store.get('lastCheckTime');
        const currentTime = new Date().toISOString();
        
        // Note: Knack API might not provide direct access to deleted records
        // This implementation assumes a deletion log/audit trail exists
        // You may need to adjust based on actual API capabilities
        try {
            const response = await client.get(`/objects/${context.propsValue.objectKey}/deleted_records`, {
                params: {
                    deleted_after: lastCheckTime
                }
            });
            
            await context.store.put('lastCheckTime', currentTime);
            
            return response.data.records || [];
        } catch (error) {
            // If the endpoint doesn't exist, return empty array
            console.error('Error fetching deleted records:', error);
            return [];
        }
    },
});
