import { createAction, Property } from '@activepieces/pieces-framework';
import {
    HttpMethod
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

export const findRecords = createAction({
    auth: insightlyAuth,
    name: 'find_records',
    displayName: 'Find Records',
    description: 'Find records in a specified Insightly object',
    props: {
        pod: Property.ShortText({
            displayName: 'Pod',
            description: 'Your Insightly pod (e.g., "na1", "eu1").',
            required: true,
            defaultValue: 'na1'
        }),
        objectName: Property.StaticDropdown({
            displayName: 'Object Type',
            description: 'Select the type of records to find',
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
        fieldName: Property.Dropdown({
            auth: insightlyAuth,
            displayName: 'Field Name',
            description: 'Select the field to search by',
            required: true,
            refreshers: ['objectName'],
            options: async ({ objectName }) => {
                if (!objectName) {
                    return {
                        disabled: true,
                        placeholder: 'Select an object type first',
                        options: []
                    };
                }
                let fields: any = {};
                switch (objectName as string) {
                    case 'Contacts': fields = contactFields; break;
                    case 'Leads': fields = leadFields; break;
                    case 'Opportunities': fields = opportunityFields; break;
                    case 'Organisations': fields = organisationFields; break;
                    case 'Projects': fields = projectFields; break;
                    case 'Tasks': fields = taskFields; break;
                    case 'Events': fields = eventFields; break;
                    case 'Products': fields = productFields; break;
                    case 'Quotations': fields = quotationFields; break;
                }
                return {
                    options: Object.keys(fields).map(key => ({
                        label: fields[key].displayName,
                        value: key
                    }))
                };
            }
        }),
        fieldValue: Property.ShortText({
            displayName: 'Field Value',
            description: 'The value to search for',
            required: true
        }),
        top: Property.Number({
            displayName: 'Limit',
            description: 'Maximum number of records to return',
            required: false
        })
    },
    async run(context) {
        const { pod, objectName, fieldName, fieldValue, top } = context.propsValue;

        const queryParams = new URLSearchParams({
            field_name: fieldName as string,
            field_value: fieldValue as string,
        });

        if (top) {
            queryParams.append('top', top.toString());
        }

        try {
            const response = await makeInsightlyRequest(
                context.auth,
                `/${objectName}/Search?${queryParams.toString()}`,
                pod as string,
                HttpMethod.GET
            );

            return response.body;
        } catch (error: any) {
            throw new Error(`Failed to find records: ${error.message}`);
        }
    }
});
