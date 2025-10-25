import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../..';

export const createContact = createAction({
    auth: zendeskSellAuth,
    name: 'create_contact',
    displayName: 'Create Contact',
    description: 'Create a new contact.',
    props: {
        last_name: Property.ShortText({
            displayName: 'Last Name',
            required: true,
        }),
        first_name: Property.ShortText({
            displayName: 'First Name',
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
        const { ...contact } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.getbase.com/v2/contacts`,
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
