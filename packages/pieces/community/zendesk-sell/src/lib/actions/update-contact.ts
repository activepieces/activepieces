import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../..';
import { contactIdDropdown } from '../common/props';

export const updateContact = createAction({
    auth: zendeskSellAuth,
    name: 'update_contact',
    displayName: 'Update Contact',
    description: 'Update an existing contact.',
    props: {
        contact_id: contactIdDropdown,
        first_name: Property.ShortText({
            displayName: 'First Name',
            required: false,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            required: false,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            required: false,
        }),
        phone: Property.ShortText({
            displayName: 'Work Phone',
            required: false,
        }),
        mobile: Property.ShortText({
            displayName: 'Mobile Phone',
            required: false,
        }),
    },
    async run(context) {
        const { contact_id, ...contact } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.PUT,
            url: `https://api.getbase.com/v2/contacts/${contact_id}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string,
            },
            body: {
                data: contact
            }
        });

        return response.body;
    },
});
