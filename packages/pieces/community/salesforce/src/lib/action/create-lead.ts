import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';
import { sobjectCreateResponseOutputSchema } from '../output-schemas';

export const createLead = createAction({
    auth: salesforceAuth,
    name: 'create_lead',
    classification: 'WRITE',
    displayName: 'Create Lead',
    description: 'Creates a lead.',
    audience: 'human',
    aiMetadata: { description: 'Create a new Lead; Last Name and Company are required. Not idempotent — each call adds another Lead, so dedup beforehand if needed. Use Update Lead to modify an existing one.', idempotent: false },
    outputSchema: sobjectCreateResponseOutputSchema,
    propertyGroups: [
        { key: 'name', display: 'section', label: 'Name', icon: 'user', props: ['FirstName', 'LastName'] },
        { key: 'company', display: 'section', label: 'Company', icon: 'users', props: ['Company', 'LeadSource'] },
        { key: 'contact_details', display: 'section', label: 'Contact Details', icon: 'inbox', props: ['Email', 'Phone'] },
    ],
    props: {
        LastName: Property.ShortText({
            displayName: 'Last Name',
            required: true,
            placeholder: 'Doe',
            width: 'half',
        }),
        Company: Property.ShortText({
            displayName: 'Company',
            required: true,
            placeholder: 'Acme Inc.',
        }),
        FirstName: Property.ShortText({
            displayName: 'First Name',
            required: false,
            placeholder: 'Jane',
            width: 'half',
        }),
        Email: Property.ShortText({
            displayName: 'Email',
            required: false,
            placeholder: 'jane@example.com',
            width: 'half',
        }),
        Phone: Property.ShortText({
            displayName: 'Phone',
            required: false,
            placeholder: '+1 415 555 0100',
            width: 'half',
        }),
        LeadSource: salesforcesCommon.leadSource,
        other_fields: Property.Json({
            displayName: 'Other Fields',
            description: 'More fields as JSON, with Salesforce field API names as keys.',
            required: false,
            advanced: true,
        })
    },
    async run(context) {

        const {
            LastName,
            Company,
            FirstName,
            Email,
            Phone,
            LeadSource,
            other_fields
        } = context.propsValue;


        const rawBody = {
            LastName,
            Company,
            FirstName,
            Email,
            Phone,
            LeadSource,
            ...(other_fields || {}), 
        };

        const cleanedBody = Object.entries(rawBody).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, unknown>);

        const response = await callSalesforceApi(
            HttpMethod.POST,
            context.auth,
            '/services/data/v56.0/sobjects/Lead',
            cleanedBody
        );

        return response.body;
    },
});