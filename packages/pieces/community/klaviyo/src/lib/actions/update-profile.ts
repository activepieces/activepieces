import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../auth';
import { klaviyoCommon } from '../common';

export const updateProfile = createAction({
    auth: klaviyoAuth,
    name: 'update_profile',
    displayName: 'Update Profile',
    description: 'Update an existing profile in Klaviyo.',
    props: {
        profile_id: Property.ShortText({
            displayName: 'Profile ID',
            description: 'The unique ID of the profile (e.g., 01GDVM...)',
            required: true,
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
        const { profile_id, first_name, last_name, properties } = context.propsValue;
        const response = await httpClient.sendRequest({
            method: HttpMethod.PATCH,
            url: `${klaviyoCommon.baseUrl}/profiles/${profile_id}`,
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
                    id: profile_id,
                    attributes: {
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
