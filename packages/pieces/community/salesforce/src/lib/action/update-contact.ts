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
        data: Property.Json({
            displayName: 'Data to Update',
            description: 'Enter the fields to update as a JSON object. For example: {"Email": "new.email@example.com", "Title": "Manager"}',
            required: true,
            defaultValue: {},
        }),
    },
    async run(context) {
        const { contact_id, data } = context.propsValue;

        await callSalesforceApi(
            HttpMethod.PATCH,
            context.auth,
            `/services/data/v56.0/sobjects/Contact/${contact_id}`,
            data as Record<string, unknown>
        );


        return {
            success: true,
        };
    },
});