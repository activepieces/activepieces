import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const updateLead = createAction({
    auth: salesforceAuth,
    name: 'update_lead',
    displayName: 'Update Lead',
    description: 'Update an existing lead.',
    props: {
        lead_id: salesforcesCommon.lead,
        FirstName: Property.ShortText({
            displayName: 'First Name',
            required: false,
        }),
        LastName: Property.ShortText({
            displayName: 'Last Name',
            required: false,
        }),
        Company: Property.ShortText({
            displayName: 'Company',
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
            displayName: 'Other Fields (Advanced)',
            description: 'Enter any additional fields to update as a JSON object.',
            required: false
        })
    },
    async run(context) {
        const {
            lead_id,
            FirstName,
            LastName,
            Company,
            Email,
            Phone,
            LeadSource,
            other_fields
        } = context.propsValue;

        const rawBody = {
            FirstName,
            LastName,
            Company,
            Email,
            Phone,
            LeadSource,
            ...(other_fields || {}),
        };

        const cleanedBody = Object.entries(rawBody).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, unknown>);

        if (Object.keys(cleanedBody).length === 0) {
            return { success: true, message: "No fields provided to update." };
        }

        await callSalesforceApi(
            HttpMethod.PATCH,
            context.auth,
            `/services/data/v56.0/sobjects/Lead/${lead_id}`,
            cleanedBody
        );

        return {
            success: true,
        };
    },
});