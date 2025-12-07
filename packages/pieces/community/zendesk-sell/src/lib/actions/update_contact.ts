import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth, ZendeskSellAuth } from '../common/auth';
import { callZendeskApi } from '../common/client';
import { zendeskSellCommon } from '../common/props';

export const updateContact = createAction({
    auth: zendeskSellAuth,
    name: 'update_contact',
    displayName: 'Update Contact',
    description: 'Update fields of an existing contact.',
    props: {
        contact_id: zendeskSellCommon.contact(true), 
        name: Property.ShortText({
            displayName: 'Organization Name',
            description: "The organization's name (only used for organizational contacts).",
            required: false,
        }),
        first_name: Property.ShortText({
            displayName: 'First Name',
            description: "The contact's first name (only used for individual contacts).",
            required: false,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            description: "The contact's last name (only used for individual contacts).",
            required: false,
        }),
        owner_id: zendeskSellCommon.owner(),
        customer_status: Property.StaticDropdown({
            displayName: 'Customer Status',
            required: false,
            options: {
                options: [
                    { label: 'None', value: 'none' },
                    { label: 'Current', value: 'current' },
                    { label: 'Past', value: 'past' },
                ]
            }
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: "The contact's primary email address.",
            required: false,
        }),
        phone: Property.ShortText({
            displayName: 'Phone',
            description: "The contact's phone number.",
            required: false,
        }),
        tags: zendeskSellCommon.tags('contact'), 
        address: Property.Json({
            displayName: 'Address',
            description: 'An object containing address details (e.g., {"line1": "2726 Smith Street", "city": "Hyannis", "country": "US"}).',
            required: false,
        }),
        custom_fields: Property.Json({
            displayName: 'Custom Fields',
            description: 'A key-value object for any custom fields (e.g., {"referral_website": "http://www.example.com"}).',
            required: false,
        }),
        other_fields: Property.Json({
            displayName: 'Other Fields',
            description: 'Enter additional fields as a JSON object (e.g., {"title": "CEO", "website": "http://example.com"}).',
            required: false
        })
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { contact_id, other_fields, ...otherProps } = propsValue;

        const rawBody: Record<string, unknown> = {
            ...otherProps,
            ...(other_fields || {}),
        };


        const cleanedBody = Object.entries(rawBody).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, unknown>);

        const response = await callZendeskApi(
            HttpMethod.PUT,
            `v2/contacts/${contact_id}`,
            auth,
            { data: cleanedBody } 
        );

        return response.body;
    },
});