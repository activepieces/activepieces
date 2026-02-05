import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getBaseUrl, instasentAuth } from '../../index';

export const deleteContact = createAction({
    name: 'delete_contact',
    displayName: 'Delete Contact',
    description: 'Delete a single contact by User ID',
    auth: instasentAuth,
    props: {
        userId: Property.ShortText({
            displayName: 'User ID',
            description: 'Unique identifier of the contact to delete',
            required: true
        })
    },

    async run(context) {
        const { userId } = context.propsValue;
        const auth = context.auth;
        const baseUrl = getBaseUrl({ projectId: auth.props.projectId, datasourceId: auth.props.datasourceId });

        const response = await httpClient.sendRequest({
            method: HttpMethod.DELETE,
            url: `${baseUrl}/stream/contacts/${userId}`,
            headers: {
                'Authorization': `Bearer ${auth.props.apiKey}`
            }
        });

        return response.body;
    }
});
