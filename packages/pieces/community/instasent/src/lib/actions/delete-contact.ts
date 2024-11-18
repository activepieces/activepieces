import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getBaseUrl } from '../../index';
import { InstasentAuthType } from '../common/types';

export const deleteContact = createAction({
    name: 'delete_contact',
    displayName: 'Delete Contact',
    description: 'Delete a single contact by User ID',

    props: {
        userId: Property.ShortText({
            displayName: 'User ID',
            description: 'Unique identifier of the contact to delete',
            required: true
        })
    },

    async run(context) {
        const { userId } = context.propsValue;
        const auth = context.auth as InstasentAuthType;
        const baseUrl = getBaseUrl({ projectId: auth.projectId, datasourceId: auth.datasourceId });

        const response = await httpClient.sendRequest({
            method: HttpMethod.DELETE,
            url: `${baseUrl}/stream/contacts/${userId}`,
            headers: {
                'Authorization': `Bearer ${auth.apiKey}`
            }
        });

        return response.body;
    }
});
