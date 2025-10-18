import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../..';

export const findCompany = createAction({
    auth: zendeskSellAuth,
    name: 'find_company',
    displayName: 'Find Company',
    description: 'Find a company (organization contact). ',
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
                is_organization: 'true',
            }
        });

        return response.body;
    },
});
