import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../..';

export const findUser = createAction({
    auth: zendeskSellAuth,
    name: 'find_user',
    displayName: 'Find User',
    description: 'Find a user.',
    props: {
        name: Property.ShortText({
            displayName: 'Name',
            required: false,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            required: false,
        }),
    },
    async run(context) {
        const { name, email } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `https://api.getbase.com/v2/users`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string,
            },
            queryParams: {
                name: name,
                email: email,
            }
        });

        return response.body;
    },
});
