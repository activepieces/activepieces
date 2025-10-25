import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../..';
import { contactIdDropdown } from '../common/props';

export const createDeal = createAction({
    auth: zendeskSellAuth,
    name: 'create_deal',
    displayName: 'Create Deal',
    description: 'Create a new deal.',
    props: {
        name: Property.ShortText({
            displayName: 'Name',
            required: true,
        }),
        contact_id: contactIdDropdown,
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
        const { ...deal } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.getbase.com/v2/deals`,
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
