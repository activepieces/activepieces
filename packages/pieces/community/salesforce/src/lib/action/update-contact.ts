import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const updateContact = createAction({
    auth: salesforceAuth,
    name: 'update_contact',
    displayName: 'Update Contact',
    description: 'Update an existing contact.',
    props: {
        contact_id: salesforcesCommon.contact,
        FirstName: Property.ShortText({
            displayName: 'First Name',
            required: false,
        }),
        LastName: Property.ShortText({
            displayName: 'Last Name',
            required: false,
        }),
        AccountId: salesforcesCommon.account,
        Email: Property.ShortText({
            displayName: 'Email',
            required: false,
        }),
        Phone: Property.ShortText({
            displayName: 'Phone',
            required: false,
        }),
        Title: Property.ShortText({
            displayName: 'Title',
            required: false,
        }),
        other_fields: Property.Json({
            displayName: 'Other Fields (Advanced)',
            description: 'Enter any additional fields to update as a JSON object.',
            required: false
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