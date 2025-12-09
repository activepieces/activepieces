import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth, ZendeskSellAuth } from '../common/auth';
import { callZendeskApi } from '../common/client';

export const findUser = createAction({
    auth: zendeskSellAuth,
    name: 'find_user',
    displayName: 'Find User',
    description: 'Finds a user by ID, email, name, or status.',
    props: {
        user_id: Property.Number({
            displayName: 'User ID',
            description: 'Find a user by their unique ID. (Prioritized over other fields)',
            required: false,
        }),
        name: Property.ShortText({
            displayName: 'Name',
            description: "Find a user by their full name.",
            required: false,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: "Find a user by their email address.",
            required: false,
        }),
        role: Property.StaticDropdown({
            displayName: 'Role',
            required: false,
            options: {
                options: [
                    { label: 'User', value: 'user' },
                    { label: 'Admin', value: 'admin' },
                ]
            }
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            required: false,
            options: {
                options: [
                    { label: 'Active', value: 'active' },
                    { label: 'Inactive', value: 'inactive' },
                ]
            }
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { user_id, name, email, role, status } = propsValue;


        if (user_id) {
            const response = await callZendeskApi(
                HttpMethod.GET,
                `v2/users/${user_id}`,
                auth
            );
            return response.body;
        }

        const params: Record<string, string> = {};
        if (name) params['name'] = name as string;
        if (email) params['email'] = email as string;
        if (role) params['role'] = role as string;
        if (status) params['status'] = status as string;


        if (Object.keys(params).length === 0) {
            throw new Error('Please provide a User ID or at least one other search field (Name, Email, etc.).');
        }
        
        const response = await callZendeskApi(
            HttpMethod.GET,
            'v2/users',
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