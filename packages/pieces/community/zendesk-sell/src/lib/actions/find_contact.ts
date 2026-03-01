import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth, ZendeskSellAuth } from '../common/auth';
import { callZendeskApi } from '../common/client';

export const findContact = createAction({
    auth: zendeskSellAuth,
    name: 'find_contact',
    displayName: 'Find Contact',
    description: 'Find a contact by email, name, or other identifier.',
    props: {
        email: Property.ShortText({
            displayName: 'Email',
            required: false,
        }),
        name: Property.ShortText({
            displayName: 'Name',
            description: "Filter by the contact's full name or organization name.",
            required: false,
        }),
        first_name: Property.ShortText({
            displayName: 'First Name',
            required: false,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            required: false,
        }),
        phone: Property.ShortText({
            displayName: 'Phone',
            required: false,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { email, name, first_name, last_name, phone } = propsValue;

        const params: Record<string, string> = {};
        if (email) params['email'] = email as string;
        if (name) params['name'] = name as string;
        if (first_name) params['first_name'] = first_name as string;
        if (last_name) params['last_name'] = last_name as string;
        if (phone) params['phone'] = phone as string;

        if (Object.keys(params).length === 0) {
            throw new Error('Please provide at least one search field (Email, Name, etc.).');
        }
        
        const response = await callZendeskApi(
            HttpMethod.GET,
            'v2/contacts',
            auth,
            undefined,
            params     
        );

        const items = (response.body as { items: Record<string, unknown>[] })?.items;

        if (items && items.length > 0) {
            return items[0]; 
        }


        return { data: null };
    },
});