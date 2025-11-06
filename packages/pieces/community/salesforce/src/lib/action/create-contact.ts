import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const createContact = createAction({
    auth: salesforceAuth,
    name: 'create_contact',
    displayName: 'Create Contact',
    description: 'Creates a new contact record.',
    props: {
        LastName: Property.ShortText({
            displayName: 'Last Name',
            required: true,
        }),
        FirstName: Property.ShortText({
            displayName: 'First Name',
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
            displayName: 'Other Fields',
            description: 'Enter additional fields as a JSON object.',
            required: false
        })
    },
    async run(context) {
        const {
            LastName,
            FirstName,
            AccountId,
            Email,
            Phone,
            Title,
            other_fields
        } = context.propsValue;


        const rawBody = {
            LastName,
            FirstName,
            AccountId,
            Email,
            Phone,
            Title,
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
            '/services/data/v56.0/sobjects/Contact',
            cleanedBody
        );

        return response.body;
    },
});