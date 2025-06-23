import { Property, createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BASE_URL } from '../common/client';
import { canvaAuth } from '../common/auth';

export const getImageAction = createAction({
    auth: canvaAuth,
    name: 'get_image',
    displayName: 'Get Image',
    description: 'Retrieve metadata of a specific asset in Canva.',
    props: {
        assetId: Property.ShortText({
            displayName: 'Asset ID',
            description: 'The ID of the asset you want to retrieve.',
            required: true,
        }),
    },
    async run(context) {
        const { assetId } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${BASE_URL}/rest/v1/assets/${assetId}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
        });

        return response.body;
    },
});
