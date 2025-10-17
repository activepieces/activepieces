import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../..';

export const findDeal = createAction({
    auth: zendeskSellAuth,
    name: 'find_deal',
    displayName: 'Find Deal',
    description: 'Find a deal.',
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
            url: `https://api.getbase.com/v2/deals`,
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
