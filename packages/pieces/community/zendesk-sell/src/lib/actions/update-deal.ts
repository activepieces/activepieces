import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../..';
import { dealIdDropdown } from '../common/props';

export const updateDeal = createAction({
    auth: zendeskSellAuth,
    name: 'update_deal',
    displayName: 'Update Deal',
    description: 'Update an existing deal.',
    props: {
        deal_id: dealIdDropdown,
        name: Property.ShortText({
            displayName: 'Name',
            required: false,
        }),
        value: Property.Number({
            displayName: 'Value',
            required: false,
        }),
        currency: Property.ShortText({
            displayName: 'Currency',
            description: 'e.g. USD',
            required: false,
        }),
    },
    async run(context) {
        const { deal_id, ...deal } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.PUT,
            url: `https://api.getbase.com/v2/deals/${deal_id}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string,
            },
            body: {
                data: deal
            }
        });

        return response.body;
    },
});
