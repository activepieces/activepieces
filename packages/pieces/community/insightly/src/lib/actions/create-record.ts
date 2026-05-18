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

export const createRecord = createAction({
    auth: insightlyAuth,
    name: 'create_record',
    displayName: 'Create Record',
    description:
        'Create a new record in a specified Insightly object (Contact, Lead, Opportunity, etc.)',
    props: {
        pod: Property.ShortText({
            displayName: 'Pod',
            description: 'Your Insightly pod (e.g., "na1", "eu1"). Find this in your API URL: https://api.{pod}.insightly.com',
            required: true,
            defaultValue: 'na1'
        }),
        objectName: Property.StaticDropdown({
            displayName: 'Object Type',
            description: 'Select the type of record to create',
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
        fields: Property.DynamicProperties({
            auth: insightlyAuth,
            displayName: 'Fields',
            required: true,
            refreshers: ['objectName'],
            props: async ({ auth, objectName }) => {
                if (!objectName) return {};
                const objName = objectName as unknown as string;
                
                const fields: DynamicPropsValue = {};
                switch (objName) {
                    case 'Contacts':
                        Object.assign(fields, contactFields);
                        break;
                    case 'Leads':
                        Object.assign(fields, leadFields);
                        break;
                    case 'Opportunities':
                        Object.assign(fields, opportunityFields);
                        break;
                    case 'Organisations':
                        Object.assign(fields, organisationFields);
                        break;
                    case 'Projects':
                        Object.assign(fields, projectFields);
                        break;
                    case 'Tasks':
                        Object.assign(fields, taskFields);
                        break;
                    case 'Events':
                        Object.assign(fields, eventFields);
                        break;
                    case 'Products':
                        Object.assign(fields, productFields);
                        break;
                    case 'Quotations':
                        Object.assign(fields, quotationFields);
                        break;
                }
                return fields;
            }
        })
    },
    async run(context) {
        const { pod, objectName, fields } = context.propsValue;

        const recordData = { ...fields };

        if (!recordData || Object.keys(recordData).length === 0) {
            throw new Error('Field values must be provided to create the record');
        }

        try {
            const response = await makeInsightlyRequest(
                context.auth,
                `/${objectName as string}`,
                pod as string,
                HttpMethod.POST,
                recordData
            );

            const recordIdKey = Object.keys(response.body).find(key => key.endsWith('_ID'));
            const recordId = recordIdKey ? response.body[recordIdKey] : undefined;

            return {
                success: true,
                recordId: recordId,
                ...response.body
            };
        } catch (error: any) {
            throw new Error(`Failed to create record: ${error.message}`);
        }
    },
});
