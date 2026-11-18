import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';
import { successOutputSchema } from '../output-schemas';

export const updateLead = createAction({
    auth: salesforceAuth,
    name: 'update_lead',
    classification: 'WRITE',
    displayName: 'Update Lead',
    description: 'Updates a lead.',
    audience: 'human',
    aiMetadata: { description: 'Update fields on an existing Lead selected by its ID; only the fields you provide are changed and the Lead must already exist. Use Create Lead to add a new one; this does not convert the Lead.', idempotent: false },
    outputSchema: successOutputSchema,
    propertyGroups: [
        { key: 'lead', display: 'section', label: 'Lead to Update', icon: 'tag', props: ['lead_id'] },
        { key: 'changes', display: 'section', label: 'Changes', icon: 'sliders', props: ['changes_info', 'FirstName', 'LastName', 'Company', 'LeadSource', 'Email', 'Phone'] },
    ],
    props: {
        lead_id: salesforcesCommon.lead,
        changes_info: Property.MarkDown({
            value: 'Empty fields keep their current value.',
            variant: MarkdownVariant.INFO,
        }),
        FirstName: Property.ShortText({
            displayName: 'First Name',
            required: false,
            placeholder: 'Jane',
            width: 'half',
        }),
        LastName: Property.ShortText({
            displayName: 'Last Name',
            required: false,
            placeholder: 'Doe',
            width: 'half',
        }),
        Company: Property.ShortText({
            displayName: 'Company',
            required: false,
            placeholder: 'Acme Inc.',
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