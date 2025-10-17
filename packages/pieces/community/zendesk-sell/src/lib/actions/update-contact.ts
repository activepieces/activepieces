import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../common/auth';
import { callZendeskApi, zendeskSellCommon } from '../common';
import { ZendeskSellAuth } from '../common/auth';

export const updateContact = createAction({
    auth: zendeskSellAuth,
    name: 'update_contact',
    displayName: 'Update Contact',
    description: 'Update fields of an existing contact.',
    props: {
        contact_id: zendeskSellCommon.contact(true),
        first_name: Property.ShortText({
            displayName: 'First Name',
            required: false,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            required: false,
        }),
        owner_id: zendeskSellCommon.owner(),
        email: Property.ShortText({
            displayName: 'Email',
            required: false,
        }),
        phone: Property.ShortText({
            displayName: 'Phone',
            required: false,
        }),
        tags: zendeskSellCommon.tags('contact'),
        other_fields: Property.Json({
            displayName: 'Other Fields',
            description: 'Enter additional fields to update as a JSON object (e.g., {"customer_status": "current", "mobile": "+1234567890"}).',
            required: false
        })
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { contact_id, other_fields, ...otherProps } = propsValue;

        const rawBody = {
            ...otherProps,
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
        
        const response = await callZendeskApi(
            HttpMethod.PUT,
            `v2/contacts/${contact_id}`,
            auth as ZendeskSellAuth,
            { data: cleanedBody } 
        );

        return response.body;
    },
});