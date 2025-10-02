import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { InsightlyClient } from './client';

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
                const auth = context['auth'] as { apiKey: string; pod: string; };
                const propsValue = context['propsValue'] as { object_type: string | undefined };
                const objectType = propsValue.object_type;

                if (!auth?.apiKey || !auth?.pod || !objectType) {
                    return { disabled: true, placeholder: 'Select an Object Type first', options: [] };
                }

                try {
                    const client = new InsightlyClient(auth.apiKey, auth.pod);
                    const records = await client.makeRequest<any[]>(HttpMethod.GET, `/${objectType}?top=500`);

                    let idField = '';
                    let nameFields: string[] = [];

                    switch(objectType) {
                        case 'Contacts': idField = 'CONTACT_ID'; nameFields = ['FIRST_NAME', 'LAST_NAME']; break;
                        case 'Leads': idField = 'LEAD_ID'; nameFields = ['FIRST_NAME', 'LAST_NAME']; break;
                        case 'Opportunities': idField = 'OPPORTUNITY_ID'; nameFields = ['OPPORTUNITY_NAME']; break;
                        case 'Organisations': idField = 'ORGANISATION_ID'; nameFields = ['ORGANISATION_NAME']; break;
                        case 'Projects': idField = 'PROJECT_ID'; nameFields = ['PROJECT_NAME']; break;
                        case 'Tasks': idField = 'TASK_ID'; nameFields = ['TITLE']; break;
                        default: return { disabled: true, placeholder: 'Object type not supported for dropdown.', options: [] };
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
    
    dynamicFields: (isCreate: boolean) =>
        Property.DynamicProperties({
            displayName: isCreate ? 'Fields' : 'Fields to Update',
            description: isCreate ? 'The fields to populate for the new record.' : 'The fields to update for the record. Only filled fields will be sent.',
            required: true,
            refreshers: ['object_type'],
            props: async (context) => {
                const { apiKey, pod } = context['auth'] as { apiKey: string, pod: string };
                const propsValue = context['propsValue'] as { object_type: string | undefined };
                const objectType = propsValue.object_type;
                const fields: DynamicPropsValue = {};

                if (!objectType) { return {}; }
                
                switch (objectType) {
                    case 'Contacts':
                        fields['FIRST_NAME'] = Property.ShortText({ displayName: 'First Name', required: false });
                        fields['LAST_NAME'] = Property.ShortText({ displayName: 'Last Name', required: isCreate });
                        fields['EMAIL_ADDRESS'] = Property.ShortText({ displayName: 'Email', required: false });
                        fields['PHONE'] = Property.ShortText({ displayName: 'Phone', required: false });
                        break;
                    case 'Leads':
                        fields['FIRST_NAME'] = Property.ShortText({ displayName: 'First Name', required: false });
                        fields['LAST_NAME'] = Property.ShortText({ displayName: 'Last Name', required: false });
                        fields['ORGANIZATION'] = Property.ShortText({ displayName: 'Organization', required: false });
                        fields['EMAIL'] = Property.ShortText({ displayName: 'Email', required: false });
                        break;
                    case 'Opportunities':
                        fields['OPPORTUNITY_NAME'] = Property.ShortText({ displayName: 'Opportunity Name', required: isCreate });
                        fields['PROBABILITY'] = Property.Number({ displayName: 'Probability (%)', required: false });
                        fields['BID_AMOUNT'] = Property.Number({ displayName: 'Bid Amount', required: false });
                        break;
                    case 'Organisations':
                        fields['ORGANISATION_NAME'] = Property.ShortText({ displayName: 'Organisation Name', required: isCreate });
                        fields['PHONE'] = Property.ShortText({ displayName: 'Phone', required: false });
                        fields['WEBSITE'] = Property.ShortText({ displayName: 'Website', required: false });
                        break;
                    case 'Projects':
                        fields['PROJECT_NAME'] = Property.ShortText({ displayName: 'Project Name', required: isCreate });
                        fields['STATUS'] = Property.ShortText({ displayName: 'Status', required: isCreate });
                        break;
                    case 'Tasks':
                        fields['TITLE'] = Property.ShortText({ displayName: 'Title', required: isCreate });
                        fields['DUE_DATE'] = Property.ShortText({ displayName: 'Due Date (YYYY-MM-DD HH:mm:ss)', required: false });
                        fields['STATUS'] = Property.ShortText({ displayName: 'Status', required: isCreate });
                        break;
                }

                const client = new InsightlyClient(apiKey, pod);
                const customFields = await client.getCustomFields();
                const objectTypeEnum = objectType.slice(0, -1).toUpperCase(); 

                for (const field of customFields) {
                    if (field.FIELD_FOR === objectTypeEnum) {
                        fields[field.FIELD_NAME] = Property.ShortText({
                            displayName: `(Custom) ${field.CUSTOM_FIELD_ID}`,
                            required: false,
                        });
                    }
                }
                return fields;
            }
        }),

        searchField: () =>
        Property.Dropdown({
            displayName: 'Search Field',
            description: 'The field to search by.',
            required: true,
            refreshers: ['object_type'],
            options: async (context) => {
                const auth = context['auth'] as { apiKey: string; pod: string; };
                const propsValue = context['propsValue'] as { object_type: string | undefined };
                const objectType = propsValue.object_type;

                if (!auth?.apiKey || !auth?.pod || !objectType) {
                    return { disabled: true, placeholder: 'Select an Object Type first', options: [] };
                }

                let standardFields: { label: string, value: string }[] = [];
                switch (objectType) {
                    case 'Contacts': standardFields = [{ label: 'Email', value: 'EMAIL_ADDRESS' }, { label: 'First Name', value: 'FIRST_NAME' }, { label: 'Last Name', value: 'LAST_NAME' }]; break;
                    case 'Leads': standardFields = [{ label: 'Email', value: 'EMAIL' }, { label: 'First Name', value: 'FIRST_NAME' }, { label: 'Last Name', value: 'LAST_NAME' }]; break;
                    case 'Opportunities': standardFields = [{ label: 'Opportunity Name', value: 'OPPORTUNITY_NAME' }]; break;
                    case 'Organisations': standardFields = [{ label: 'Organisation Name', value: 'ORGANISATION_NAME' }, { label: 'Phone', value: 'PHONE' }]; break;
                    case 'Projects': standardFields = [{ label: 'Project Name', value: 'PROJECT_NAME' }]; break;
                    case 'Tasks': standardFields = [{ label: 'Title', value: 'TITLE' }]; break;
                }

                try {
                    const client = new InsightlyClient(auth.apiKey, auth.pod);
                    const customFields = await client.getCustomFields();
                    const objectTypeEnum = objectType.slice(0, -1).toUpperCase();
                    
                    const customFieldOptions = customFields
                        .filter(field => field.FIELD_FOR === objectTypeEnum)
                        .map(field => ({
                            label: `(Custom) ${field.CUSTOM_FIELD_ID}`,
                            value: field.FIELD_NAME,
                        }));
                    
                    return {
                        disabled: false,
                        options: [...standardFields, ...customFieldOptions],
                    };
                } catch (error) {
                    return { disabled: true, placeholder: 'Error fetching fields.', options: [] };
                }
            },
        }),
};