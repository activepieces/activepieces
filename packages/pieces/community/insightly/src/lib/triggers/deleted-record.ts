import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { insightlyAuth } from "../common/auth";
import { InsightlyClient } from '../common/client';


const getIdKey = (objectType: string): string => {
    switch(objectType) {
        case 'Contacts': return 'CONTACT_ID';
        case 'Leads': return 'LEAD_ID';
        case 'Opportunities': return 'OPPORTUNITY_ID';
        case 'Organisations': return 'ORGANISATION_ID';
        case 'Projects': return 'PROJECT_ID';
        case 'Tasks': return 'TASK_ID';
        default: return '';
    }
};

export const deletedRecordTrigger = createTrigger({
    auth: insightlyAuth,
    name: 'deleted_record',
    displayName: 'Deleted Record',
    description: 'Fires when a record is deleted. Note: This can be slow and API-intensive for large accounts.',
    type: TriggerStrategy.POLLING,
    props: {
        object_type: Property.StaticDropdown({
            displayName: 'Object Type',
            description: 'The type of Insightly object to monitor for deletions.',
            required: true,
            options: {
                options: [
                    { label: 'Contact', value: 'Contacts' },
                    { label: 'Lead', value: 'Leads' },
                    { label: 'Opportunity', value: 'Opportunities' },
                    { label: 'Organisation', value: 'Organisations' },
                    { label: 'Project', value: 'Projects' },
                    { label: 'Task', value: 'Tasks' },
                ],
            },
        }),
    },

    async onEnable(context) {
        const { apiKey, pod } = context.auth;
        const { object_type } = context.propsValue;
        const client = new InsightlyClient(apiKey, pod);

        const allRecords = await client.fetchAllRecords(object_type);
        const idKey = getIdKey(object_type);
        if (!idKey) return;

        const recordIds = allRecords.map((r: any) => r[idKey]);
        await context.store.put('knownRecordIds', recordIds);
    },


    async onDisable(context) {
        await context.store.delete('knownRecordIds');
    },

    async run(context) {
        const { apiKey, pod } = context.auth;
        const { object_type } = context.propsValue;
        const client = new InsightlyClient(apiKey, pod);
        
        const knownRecordIds = await context.store.get<number[]>('knownRecordIds') || [];
        
        const allRecords = await client.fetchAllRecords(object_type);
        const idKey = getIdKey(object_type);
        if (!idKey) return [];

        const currentRecordIds = allRecords.map((r: any) => r[idKey]);

        const deletedIds = knownRecordIds.filter(id => id && !currentRecordIds.includes(id));


        await context.store.put('knownRecordIds', currentRecordIds);

        return deletedIds.map(id => ({
            id,
            objectType: object_type,
            deletedAt: new Date().toISOString(),
        }));
    },

    async test() {
        return [];
    },

    sampleData: {
        id: 1234567,
        objectType: 'Contacts',
        deletedAt: '2025-10-26T10:00:00.000Z',
    },
});