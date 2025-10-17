import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../common/auth';
import { callZendeskApi, zendeskSellCommon } from '../common';
import { ZendeskSellAuth } from '../common/auth';

export const findUser = createAction({
    auth: zendeskSellAuth,
    name: 'find_user',
    displayName: 'Find User',
    description: 'Finds a user by ID or email.',
    props: {
        search_method: Property.StaticDropdown({
            displayName: 'Search Method',
            required: true,
            options: {
                options: [
                    { label: 'Find by ID', value: 'id' },
                    { label: 'Find by Email', value: 'email' },
                ]
            }
        }),
        search_value: Property.DynamicProperties({
            displayName: 'Search Value',
            required: true,
            refreshers: ['search_method'],
            props: async (propsValue) => {
                const search_method = propsValue['search_method'] as unknown as string;
                const fields: any = {};

                if (search_method === 'id') {
                    fields.user_id = zendeskSellCommon.owner();
                    fields.user_id.displayName = "User";
                    fields.user_id.required = true;
                } else if (search_method === 'email') {
                    fields.email = Property.ShortText({
                        displayName: 'Email',
                        description: 'The email of the user to find.',
                        required: true,
                    });
                }
                return fields;
            }
        }),
        fail_on_not_found: Property.Checkbox({
            displayName: 'Fail if Not Found',
            description: 'If checked, the step will fail if no user is found.',
            required: false,
            defaultValue: false,
        })
    },
    async run(context) {
        const { auth, propsValue } = context;
        let userData = null;

        if (propsValue.search_method === 'id') {
            const userId = (propsValue.search_value as any).user_id;
            try {
                const response = await callZendeskApi<{ data: unknown }>(HttpMethod.GET, `v2/users/${userId}`, auth as ZendeskSellAuth);
                userData = response.body?.data;
            } catch (error: any) {
                if (error.response?.status !== 404) throw error;
            }
        } else { 
            const email = (propsValue.search_value as any).email;
            const response = await callZendeskApi<{ items: { data: unknown }[] }>(
                HttpMethod.GET, `v2/users?email=${encodeURIComponent(email)}`, auth as ZendeskSellAuth
            );
            
            if (response.body.items.length > 0) {
                userData = response.body.items[0].data;
            }
        }

        if (!userData && propsValue.fail_on_not_found) {
            throw new Error(`User not found.`);
        }

        return userData;
    },
});