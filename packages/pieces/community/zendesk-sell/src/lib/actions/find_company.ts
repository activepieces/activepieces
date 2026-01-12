import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth, ZendeskSellAuth } from '../common/auth';
import { callZendeskApi } from '../common/client';

export const findCompany = createAction({
    auth: zendeskSellAuth,
    name: 'find_company',
    displayName: 'Find Company',
    description: 'Finds a company (organization contact) by name, email, or phone.',
    props: {
        name: Property.ShortText({
            displayName: 'Company Name',
            description: "The exact name of the company to find.",
            required: false,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: "The company's primary email address.",
            required: false,
        }),
        phone: Property.ShortText({
            displayName: 'Phone',
            description: "The company's primary phone number.",
            required: false,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { name, email, phone } = propsValue;

 
        const params: Record<string, string> = {
            is_organization: 'true'
        };
        
        
        if (name) params['name'] = name as string;
        if (email) params['email'] = email as string;
        if (phone) params['phone'] = phone as string;

        
        if (Object.keys(params).length === 1) { 
            throw new Error('Please provide at least one search field (Company Name, Email, or Phone).');
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