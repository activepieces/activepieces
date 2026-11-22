import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { instasentAuth } from '../auth';
import { instasentCommon } from '../common';

export const deleteContact = createAction({
    name: 'delete_contact',
    classification: 'DESTRUCTIVE',
    displayName: 'Delete Contact',
    description: 'Delete a single contact by User ID',
    audience: 'both',
    aiMetadata: { description: 'Deletes one contact from an Instasent datasource by its User ID. Use to remove a contact you can identify by stable User ID. Idempotent: deleting an already-removed contact leaves the same end state.', idempotent: true },
    auth: instasentAuth,
    props: {
        userId: Property.ShortText({
            displayName: 'User ID',
            description: 'The User ID the contact was added with.',
            placeholder: 'user-1234',
            required: true
        })
    },

    async run(context) {
        const { userId } = context.propsValue;
        const auth = context.auth;
        const baseUrl = instasentCommon.getBaseUrl({ projectId: auth.props.projectId, datasourceId: auth.props.datasourceId });

        const response = await httpClient.sendRequest({
            method: HttpMethod.DELETE,
            url: `${baseUrl}/stream/contacts/${encodeURIComponent(userId)}`,
            headers: {
                'Authorization': `Bearer ${auth.props.apiKey}`
            }
        });

        return response.body;
    }
});
