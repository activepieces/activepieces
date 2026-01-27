import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import {
    HttpMethod,
} from '@activepieces/pieces-common';
import { insightlyAuth, makeInsightlyRequest } from '../common/common';
import {
    contactFields,
    leadFields,
    opportunityFields,
    organisationFields,
    projectFields,
    taskFields,
    eventFields,
    productFields,
    quotationFields,
} from '../common/props';


export const updateRecord = createAction({
    auth: insightlyAuth,
    name: 'update_record',
    displayName: 'Update Record',
    description:
        "Update an existing record's fields in a specified Insightly object",
    props: {
        pod: Property.ShortText({
            displayName: 'Pod',
            description: 'Your Insightly pod (e.g., "na1", "eu1"). Find this in your API URL: https://api.{pod}.insightly.com',
            required: true,
            defaultValue: 'na1'
        }),
        objectName: Property.StaticDropdown({
            displayName: 'Object Type',
            description: 'Select the type of object that contains the record you want to update',
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
            description: 'Select the record to update',
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
        }),
        fields: Property.DynamicProperties({
            auth: insightlyAuth,
            displayName: 'Fields',
            description: 'The new field values to update.',
            required: true,
            refreshers: ['objectName', 'recordId', 'pod'],
            props: async ({ auth, objectName, recordId, pod }) => {
                if (!objectName || !recordId || !pod || !auth) {
                    return {};
                }
                const objName = objectName as unknown as string;
                const podName = pod as unknown as string;

                const record = await makeInsightlyRequest(
                    auth,
                    `/${objName}/${recordId as unknown as string}`,
                    podName
                );

                let fieldDefinitions: any = {};
                switch (objName) {
                    case 'Contacts':
                        fieldDefinitions = contactFields;
                        break;
                    case 'Leads':
                        fieldDefinitions = leadFields;
                        break;
                    case 'Opportunities':
                        fieldDefinitions = opportunityFields;
                        break;
                    case 'Organisations':
                        fieldDefinitions = organisationFields;
                        break;
                    case 'Projects':
                        fieldDefinitions = projectFields;
                        break;
                    case 'Tasks':
                        fieldDefinitions = taskFields;
                        break;
                    case 'Events':
                        fieldDefinitions = eventFields;
                        break;
                    case 'Products':
                        fieldDefinitions = productFields;
                        break;
                    case 'Quotations':
                        fieldDefinitions = quotationFields;
                        break;
                }
                
                // Clone the field definitions and set default values from the record
                const fields: DynamicPropsValue = {};
                for (const key in fieldDefinitions) {
                    const fieldDef = fieldDefinitions[key];
                    fields[key] = {
                        ...fieldDef,
                        defaultValue: record.body[key]
                    };
                }
                return fields;
            }
        })
    },
    async run(context) {
        const { pod, objectName, recordId, fields } = context.propsValue;

        // Use the provided field values as the record data
        const recordData = { ...fields };

        // The API requires the ID in the body for PUT requests.
        // We create the ID key dynamically, e.g., 'CONTACT_ID', 'OPPORTUNITY_ID'
        const idKey = `${(objectName as string).slice(0, -1).toUpperCase()}_ID`;
        recordData[idKey] = recordId;


        try {
            const response = await makeInsightlyRequest(
                context.auth,
                `/${objectName as string}/${recordId as string}`,
                pod as string,
                HttpMethod.PUT,
                recordData
            );

            return {
                success: true,
                ...response.body
            };
        } catch (error: any) {
            // Handle specific error cases
            if (error.response?.status === 400) {
                const errorMessage =
                    error.response.body?.message ||
                    error.response.body?.error ||
                    'Invalid data provided or record not found';
                const errorDetails = error.response.body
                    ? JSON.stringify(error.response.body, null, 2)
                    : 'No details available';
                throw new Error(
                    `Data validation error for ${objectName} ID ${recordId}: ${errorMessage}. ` +
                    `Sent data: ${JSON.stringify(recordData, null, 2)}. ` +
                    `API response: ${errorDetails}`
                );
            } else if (error.response?.status === 401) {
                throw new Error(
                    'Authentication failed. Please check your API key and pod.'
                );
            } else if (error.response?.status === 402) {
                throw new Error('Record limit reached for your Insightly plan.');
            } else if (error.response?.status === 404) {
                throw new Error(
                    `Record with ID ${recordId} not found in ${objectName}`
                );
            } else {
                throw new Error(`Failed to update record: ${error.message}`);
            }
        }
    }
});
