import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../auth';
import { klaviyoCommon } from '../common';

export const findProfile = createAction({
    auth: klaviyoAuth,
    name: 'find_profile',
    displayName: 'Find Profile by Email',
    description: 'Find a profile in Klaviyo using an email address.',
    props: {
        email: Property.ShortText({
            displayName: 'Email',
            required: true,
        }),
    },
    async run(context) {
        const { email } = context.propsValue;
        const response = await httpClient.sendRequest<{ data: any[] }>({
            method: HttpMethod.GET,
            url: `${klaviyoCommon.baseUrl}/profiles`,
            headers: {
                'revision': klaviyoCommon.apiVersion,
                'accept': 'application/vnd.api+json'
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string,
            },
            queryParams: {
                'filter': `equals(email,"${email}")`
            }
        });
        
        return response.body.data.length > 0 ? response.body.data[0] : null;
    },
});
