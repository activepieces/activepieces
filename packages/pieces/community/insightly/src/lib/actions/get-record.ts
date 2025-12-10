import { createAction, Property } from '@activepieces/pieces-framework';
import {
    HttpMethod
} from '@activepieces/pieces-common';
import { insightlyAuth, makeInsightlyRequest } from '../common/common';

export const getRecord = createAction({
    auth: insightlyAuth,
    name: 'get_record',
    displayName: 'Get Record',
    description: 'Get a record by ID from a specified Insightly object',
    props: {
        pod: Property.ShortText({
            displayName: 'Pod',
            description: 'Your Insightly pod (e.g., "na1", "eu1"). Find this in your API URL: https://api.{pod}.insightly.com',
            required: true,
            defaultValue: 'na1'
        }),
        objectName: Property.StaticDropdown({
            displayName: 'Object Type',
            description: 'Select the type of record to retrieve',
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
        }),
        recordId: Property.Dropdown({
            auth: insightlyAuth,
            displayName: 'Record ID',
            description: 'Select the record to retrieve',
            required: true,
            refreshers: ['objectName', 'pod'],
            options: async ({ auth, objectName, pod }) => {
                if (!objectName || !pod || !auth) {
                    return {
                        disabled: true,
                        placeholder: 'Please select an object type and pod first',
                        options: []
                    };
                }

                const response = await makeInsightlyRequest(
                    auth,
                    `/${objectName}?top=100&brief=true`,
                    pod as string
                );

                const records = Array.isArray(response.body) ? response.body : [];
                
                return {
                    options: records.map((record: any) => {
                        const idKey = Object.keys(record).find(key => key.endsWith('_ID'));
                        const recordId = idKey ? record[idKey] : 'Unknown ID';

                        const nameKey = Object.keys(record).find(key => key.endsWith('_NAME') || key === 'TITLE' || key === 'FIRST_NAME');
                        let recordName = nameKey ? record[nameKey] : `Record ${recordId}`;

                        if (objectName === 'Contacts' || objectName === 'Leads') {
                            recordName = `${record.FIRST_NAME || ''} ${record.LAST_NAME || ''}`.trim();
                        }
                        
                        return {
                            label: `${recordName} (ID: ${recordId})`,
                            value: recordId
                        };
                    })
                };
            }
        })
    },
    async run(context) {
        const { pod, objectName, recordId } = context.propsValue;

        try {
            const response = await makeInsightlyRequest(
                context.auth,
                `/${objectName as string}/${recordId as string}`,
                pod as string,
                HttpMethod.GET
            );

            return response.body;
        } catch (error: any) {
            // Handle specific error cases
            if (error.response?.status === 404) {
                throw new Error(`Record with ID ${recordId} not found in ${objectName}`);
            } else {
                throw new Error(`Failed to retrieve record: ${error.message}`);
            }
        }
    },
});