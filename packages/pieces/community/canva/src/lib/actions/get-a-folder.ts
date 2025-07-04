import { Property, createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BASE_URL } from '../common/client';
import { canvaAuth } from '../common/auth';

export const getFolderAction = createAction({
    auth: canvaAuth,
    name: 'get_folder',
    displayName: 'Get Folder',
    description: 'Retrieve metadata of a specific folder in Canva.',
    props: {
        folderId: Property.ShortText({
            displayName: 'Folder ID',
            description: 'The ID of the folder you want to retrieve.',
            required: true,
        }),
    },
    async run(context) {
        const { folderId } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${BASE_URL}/rest/v1/folders/${folderId}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
        });

        return response.body;
    },
});
