import { Property, createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BASE_URL } from '../common/client';
import { canvaAuth } from '../common/auth';

export const findDesignAction = createAction({
    auth: canvaAuth,
    name: 'find_design',
    displayName: 'Find Design',
    description: 'Retrieve the metadata for a specific design in Canva.',
    props: {
        designId: Property.ShortText({
            displayName: 'Design ID',
            description: 'The ID of the design to search for.',
            required: true,
        }),
    },
    async run(context) {
        const { designId } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${BASE_URL}/rest/v1/designs/${designId}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
        });

        return response.body;
    },
});
