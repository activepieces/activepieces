import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../auth';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const delete_visit = createAction({
    name: 'delete_visit',
    auth: simplirouteAuth,
    displayName: 'Delete Visit',
    description: 'Delete a visit by its ID.',
    audience: 'both',
    aiMetadata: { description: 'Permanently delete a single visit by its ID. Destructive and not safely repeatable: once deleted the visit is gone and a repeat call will fail, so confirm the ID before calling.', idempotent: false },
    props: {
        visit_id: Property.Number({ 
            displayName: 'visit_id', 
            description: 'ID of the visit to delete.', 
            required: true 
        }),
    },
    async run(context) {
        const url = `${API_BASE_URL}/v1/routes/visits/${context.propsValue.visit_id}/`;
        const response = await httpClient.sendRequest({
            method: HttpMethod.DELETE,
            url,
            headers: {
                ...commonHeaders,
                'Authorization': `Token ${context.auth.secret_text}`
            }
        });
        return {
            status: response.status,
            data: response.body
        };
    },
});