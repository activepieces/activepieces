import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../auth';
import { klaviyoCommon } from '../common';

export const removeProfileFromList = createAction({
    auth: klaviyoAuth,
    name: 'remove_profile_from_list',
    displayName: 'Remove Profile from List',
    description: 'Remove an existing profile from a Klaviyo list.',
    props: {
        list_id: klaviyoCommon.list_id,
        profile_id: Property.ShortText({
            displayName: 'Profile ID',
            description: 'The unique ID of the profile (e.g., 01GDVM...)',
            required: true,
        }),
    },
    async run(context) {
        const { list_id, profile_id } = context.propsValue;
        const response = await httpClient.sendRequest({
            method: HttpMethod.DELETE,
            url: `${klaviyoCommon.baseUrl}/lists/${list_id}/relationships/profiles`,
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
                data: [
                    {
                        type: 'profile',
                        id: profile_id
                    }
                ]
            },
        });
        return response.body;
    },
});
