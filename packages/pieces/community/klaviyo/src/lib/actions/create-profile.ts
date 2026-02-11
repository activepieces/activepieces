import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../auth';
import { klaviyoCommon } from '../common';

export const createProfile = createAction({
    auth: klaviyoAuth,
    name: 'create_profile',
    displayName: 'Create Profile',
    description: 'Add a new profile to Klaviyo.',
    props: {
        email: Property.ShortText({
            displayName: 'Email',
            required: false,
        }),
        phone_number: Property.ShortText({
            displayName: 'Phone Number',
            required: false,
        }),
        first_name: Property.ShortText({
            displayName: 'First Name',
            required: false,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            required: false,
        }),
        properties: Property.Object({
            displayName: 'Custom Properties',
            required: false,
        }),
    },
    async run(context) {
        const { email, phone_number, first_name, last_name, properties } = context.propsValue;
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${klaviyoCommon.baseUrl}/profiles`,
            headers: {
                'revision': klaviyoCommon.apiVersion,
                'content-type': 'application/vnd.api+json',
                'accept': 'application/vnd.api+json'
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string,
            },
            body: {
                data: {
                    type: 'profile',
                    attributes: {
                        email,
                        phone_number,
                        first_name,
                        last_name,
                        properties: properties || {}
                    }
                }
            },
        });
        return response.body;
    },
});
