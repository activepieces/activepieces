import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const createLead = createAction({
    auth: salesforceAuth,
    name: 'create_lead',
    displayName: 'Create Lead',
    description: 'Creates a new lead.',
    props: {
        LastName: Property.ShortText({
            displayName: 'Last Name',
            required: true,
        }),
        Company: Property.ShortText({
            displayName: 'Company',
            required: true,
        }),
        FirstName: Property.ShortText({
            displayName: 'First Name',
            required: false,
        }),
        Email: Property.ShortText({
            displayName: 'Email',
            required: false,
        }),
        Phone: Property.ShortText({
            displayName: 'Phone',
            required: false,
        }),
        LeadSource: salesforcesCommon.leadSource,
        other_fields: Property.Json({
            displayName: 'Other Fields',
            description: 'Enter additional fields as a JSON object (e.g., {"Title": "Manager", "Website": "http://example.com"}).',
            required: false
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