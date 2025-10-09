import {
    createTrigger,
    Property,
    TriggerStrategy
} from '@activepieces/pieces-framework';
import {
    HttpMethod
} from '@activepieces/pieces-common';
import { insightlyAuth, makeInsightlyRequest } from '../common/common';

export const deletedRecord = createTrigger({
    auth: insightlyAuth,
    name: 'deleted_record',
    displayName: 'Deleted Record',
    description: 'Fires when a record is deleted from Insightly',
    type: TriggerStrategy.POLLING,
    props: {
        pod: Property.ShortText({
            displayName: 'Pod',
            description: 'Your Insightly pod (e.g., "na1", "eu1").',
            required: true,
            defaultValue: 'na1'
        }),
        objectType: Property.StaticDropdown({
            displayName: 'Object Type',
            description: 'The type of Insightly object to monitor for deletions',
            required: true,
            options: {
                options: [
                    { label: 'Contact', value: 'Contacts' },
                    { label: 'Lead', value: 'Leads' },
                    { label: 'Opportunity', value: 'Opportunities' },
                    { label: 'Organization', value: 'Organisations' },
                    { label: 'Project', value: 'Projects' },
                    { label: 'Task', value: 'Tasks' },
                    { label: 'Event', value: 'Events' },
                    { label: 'Product', value: 'Products' },
                    { label: 'Quote', value: 'Quotations' }
                ]
            }
        })
    },
    async onEnable(context) {
        await context.store.put(`known_records_${context.propsValue.objectType}`, {});
    },
    async onDisable(context) {
        await context.store.delete(`known_records_${context.propsValue.objectType}`);
    },
    async run(context) {
        const { pod, objectType } = context.propsValue;
        
        const response = await makeInsightlyRequest(
            context.auth,
            `/${objectType}?brief=true&top=500`,
            pod as string,
            HttpMethod.GET
        );
        
        const records = Array.isArray(response.body) ? response.body : [];
        const currentTimeMs = Date.now();
        const currentTime = new Date(currentTimeMs).toISOString();

        const getRecordId = (record: any) => {
            const idKey = Object.keys(record).find(key => key.endsWith('_ID'));
            return idKey ? String(record[idKey]) : String(record['ID'] || '');
        };
        
        const getRecordName = (record: any) => {
            if (record.FIRST_NAME || record.LAST_NAME) {
                return `${record.FIRST_NAME || ''} ${record.LAST_NAME || ''}`.trim();
            }
            const nameKey = Object.keys(record).find(key => 
                key.endsWith('_NAME') || key === 'TITLE'
            );
            return nameKey ? String(record[nameKey]) : undefined;
        };

        const currentRecordIds = new Set(records.map(getRecordId));

        const storeKey = `known_records_${objectType}`;
        const storedRecords = (await context.store.get<Record<string, { name: string; lastSeenMs: number }>>(storeKey)) || {};
        const storedRecordIds = new Set(Object.keys(storedRecords));
        
        const deletedRecords: any[] = [];
        const DELETION_THRESHOLD_MS = 15 * 60 * 1000;

        for (const storedId of storedRecordIds) {
            if (!currentRecordIds.has(storedId)) {
                const timeSinceLastSeen = currentTimeMs - storedRecords[storedId].lastSeenMs;
                
                if (timeSinceLastSeen > DELETION_THRESHOLD_MS) {
                    deletedRecords.push({
                        recordId: storedId,
                        recordName: storedRecords[storedId].name || `Record ${storedId}`,
                        deletedAt: currentTime,
                        objectType,
                        lastSeenAt: new Date(storedRecords[storedId].lastSeenMs).toISOString()
                    });
                    delete storedRecords[storedId];
                }
            } else {
                const recordId = storedId;
                const record = records.find(r => getRecordId(r) === recordId);
                if (record) {
                    storedRecords[recordId] = {
                        name: getRecordName(record) || storedRecords[recordId].name,
                        lastSeenMs: currentTimeMs
                    };
                }
            }
        }

        for (const record of records) {
            const recordId = getRecordId(record);
            if (!storedRecords[recordId]) {
                storedRecords[recordId] = {
                    name: getRecordName(record) || `Record ${recordId}`,
                    lastSeenMs: currentTimeMs
                };
            }
        }

        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
        Object.keys(storedRecords).forEach((id) => {
            if (currentTimeMs - storedRecords[id].lastSeenMs > THIRTY_DAYS_MS) {
                delete storedRecords[id];
            }
        });

        await context.store.put(storeKey, storedRecords);

        return deletedRecords;
    },
    test: async (context) => {
        return [
            {
                recordId: 123456,
                recordName: 'Test Deleted Record',
                deletedAt: new Date().toISOString(),
                objectType: context.propsValue.objectType,
            }
        ];
    },
    sampleData: {}
});
