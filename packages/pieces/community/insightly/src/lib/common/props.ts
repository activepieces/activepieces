import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { InsightlyClient } from './client';

type InsightlyPropsContext = {
    auth: { apiKey: string, pod: string },
    object_type: string | undefined,
}

const getRecordLabel = (record: Record<string, any>, nameFields: string[]): string => {
    const labelParts = nameFields.map(field => record[field]).filter(Boolean);
    return labelParts.length > 0 ? labelParts.join(' ') : record[Object.keys(record)[0]];
}

export const insightlyProps = {
    recordId: () =>
        Property.Dropdown({
            displayName: 'Record',
            description: 'The record to select from the list.',
            required: true,
            refreshers: ['object_type'],
            options: async (context) => {
                const { auth, object_type } = context as unknown as InsightlyPropsContext;
                if (!auth?.apiKey || !auth?.pod || !object_type) {
                    return { disabled: true, placeholder: 'Select an Object Type first', options: [] };
                }
                try {
                    const client = new InsightlyClient(auth.apiKey, auth.pod);
                    const records = await client.fetchAllRecords(object_type);
                    
                    let idField = '';
                    let nameFields: string[] = [];
                    switch(object_type) {
                        case 'Contacts': idField = 'CONTACT_ID'; nameFields = ['FIRST_NAME', 'LAST_NAME']; break;
                        case 'Leads': idField = 'LEAD_ID'; nameFields = ['FIRST_NAME', 'LAST_NAME']; break;
                        case 'Opportunities': idField = 'OPPORTUNITY_ID'; nameFields = ['OPPORTUNITY_NAME']; break;
                        case 'Organisations': idField = 'ORGANISATION_ID'; nameFields = ['ORGANISATION_NAME']; break;
                        case 'Projects': idField = 'PROJECT_ID'; nameFields = ['PROJECT_NAME']; break;
                        case 'Tasks': idField = 'TASK_ID'; nameFields = ['TITLE']; break;
                        default: return { disabled: true, placeholder: 'Object type not supported.', options: [] };
                    }
                    return {
                        disabled: false,
                        options: records.map((record) => ({
                            label: getRecordLabel(record, nameFields),
                            value: record[idField],
                        })),
                    };
                } catch (error) {
                    return { disabled: true, placeholder: 'Error fetching records.', options: [] };
                }
            },
        }),

    searchField: () =>
        Property.Dropdown({
            displayName: 'Search Field',
            description: 'The standard field to search by.',
            required: true,
            refreshers: ['object_type'],
            options: async (context) => {
                const { object_type } = context as unknown as InsightlyPropsContext;
                if (!object_type) {
                    return { disabled: true, placeholder: 'Select an Object Type first', options: [] };
                }

                let standardFields: { label: string, value: string }[] = [];
                switch (object_type) {
                    case 'Contacts': standardFields = [{ label: 'Email', value: 'EMAIL_ADDRESS' }, { label: 'First Name', value: 'FIRST_NAME' }, { label: 'Last Name', value: 'LAST_NAME' }]; break;
                    case 'Leads': standardFields = [{ label: 'Email', value: 'EMAIL' }, { label: 'First Name', value: 'FIRST_NAME' }, { label: 'Last Name', value: 'LAST_NAME' }]; break;
                    case 'Opportunities': standardFields = [{ label: 'Opportunity Name', value: 'OPPORTUNITY_NAME' }]; break;
                    case 'Organisations': standardFields = [{ label: 'Organisation Name', value: 'ORGANISATION_NAME' }, { label: 'Phone', value: 'PHONE' }]; break;
                    case 'Projects': standardFields = [{ label: 'Project Name', value: 'PROJECT_NAME' }]; break;
                    case 'Tasks': standardFields = [{ label: 'Title', value: 'TITLE' }]; break;
                }
                return {
                    disabled: false,
                    options: standardFields,
                };
            },
        }),
};