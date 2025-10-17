import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../common/auth';
import { callZendeskApi, zendeskSellCommon } from '../common';
import { ZendeskSellAuth } from '../common/auth';

export const findContact = createAction({
    auth: zendeskSellAuth,
    name: 'find_contact',
    displayName: 'Find Contact',
    description: 'Find a contact by email or ID.',
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
                    fields.contact_id = zendeskSellCommon.contact(true);
                } else if (search_method === 'email') {
                    fields.email = Property.ShortText({
                        displayName: 'Email',
                        description: 'The email of the contact to find.',
                        required: true,
                    });
                }
                return fields;
            }
        }),
        fail_on_not_found: Property.Checkbox({
            displayName: 'Fail if Not Found',
            description: 'If checked, the step will fail if no contact is found.',
            required: false,
            defaultValue: false,
        })
    },
    async run(context) {
        const { auth, propsValue } = context;
        let contactData = null;

        if (propsValue.search_method === 'id') {
            const contactId = (propsValue.search_value as any).contact_id;
            try {
                const response = await callZendeskApi<{ data: unknown }>(HttpMethod.GET, `v2/contacts/${contactId}`, auth as ZendeskSellAuth);
                contactData = response.body?.data;
            } catch (error: any) {
                if (error.response?.status !== 404) {
                    throw error;
                }
            }
        } else { 
            const email = (propsValue.search_value as any).email;
            const response = await callZendeskApi<{ items: { data: unknown }[] }>(
                HttpMethod.GET, `v2/contacts?email=${encodeURIComponent(email)}`, auth as ZendeskSellAuth
            );
            
            if (response.body.items.length > 0) {
                contactData = response.body.items[0].data;
            }
        }

        if (!contactData && propsValue.fail_on_not_found) {
            throw new Error(`Contact not found.`);
        }

        return contactData;
    },
});