import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../..';

export const createLead = createAction({
    auth: zendeskSellAuth,
    name: 'create_lead',
    displayName: 'Create Lead',
    description: 'Create a new lead.',
    props: {
        last_name: Property.ShortText({
            displayName: 'Last Name',
            required: true,
        }),
        first_name: Property.ShortText({
            displayName: 'First Name',
            required: false,
        }),
        organization_name: Property.ShortText({
            displayName: 'Organization Name',
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
        const { ...lead } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.getbase.com/v2/leads`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string,
            },
            body: {
                data: lead
            }
        });

        return response.body;
    },
});
