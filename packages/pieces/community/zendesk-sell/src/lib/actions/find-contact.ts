import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../..';

export const findContact = createAction({
    auth: zendeskSellAuth,
    name: 'find_contact',
    displayName: 'Find Contact',
    description: 'Find a contact.',
    props: {
        name: Property.ShortText({
            displayName: 'Name',
            required: false,
        }),
    },
    async run(context) {
        const { name } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `https://api.getbase.com/v2/contacts`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string,
            },
            queryParams: {
                name: name,
            }
        });

        return response.body;
    },
});
