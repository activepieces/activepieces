import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';
import { successOutputSchema } from '../output-schemas';

export const updateContact = createAction({
    auth: salesforceAuth,
    name: 'update_contact',
    classification: 'WRITE',
    displayName: 'Update Contact',
    description: 'Updates a contact.',
    audience: 'human',
    aiMetadata: { description: 'Update fields (name, email, phone, title, account, or arbitrary extra fields) on an existing Salesforce Contact identified by its record Id. Use when you already have the contact Id and want to modify it rather than create one. Idempotent: re-applying the same field values to the same Id yields the same result; omitted fields are left unchanged, and a call with no fields is a no-op.', idempotent: true },
    outputSchema: successOutputSchema,
    propertyGroups: [
        { key: 'contact', display: 'section', label: 'Contact to Update', icon: 'user', props: ['contact_id'] },
        { key: 'changes', display: 'section', label: 'Changes', icon: 'sliders', props: ['changes_info', 'FirstName', 'LastName', 'Email', 'Phone', 'AccountId', 'Title'] },
    ],
    props: {
        contact_id: salesforcesCommon.contact,
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
        AccountId: salesforcesCommon.account,
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
        Title: Property.ShortText({
            displayName: 'Title',
            required: false,
            placeholder: 'Head of Sales',
        }),
        other_fields: Property.Json({
            displayName: 'Other Fields',
            description: 'More fields as JSON, with Salesforce field API names as keys.',
            required: false,
            advanced: true,
        })
    },
    async run(context) {
        const {
            contact_id,
            FirstName,
            LastName,
            AccountId,
            Email,
            Phone,
            Title,
            other_fields
        } = context.propsValue;

        const rawBody = {
            FirstName,
            LastName,
            AccountId,
            Email,
            Phone,
            Title,
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
            `/services/data/v56.0/sobjects/Contact/${contact_id}`,
            cleanedBody
        );

        return {
            success: true,
        };
    },
});