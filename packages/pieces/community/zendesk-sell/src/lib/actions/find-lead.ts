import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../..';

export const findLead = createAction({
    auth: zendeskSellAuth,
    name: 'find_lead',
    displayName: 'Find Lead',
    description: 'Find a lead.',
    props: {
        last_name: Property.ShortText({
            displayName: 'Last Name',
            required: false,
        }),
    },
    async run(context) {
        const { last_name } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `https://api.getbase.com/v2/leads`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string,
            },
            queryParams: {
                last_name: last_name,
            }
        });

        return response.body;
    },
});
