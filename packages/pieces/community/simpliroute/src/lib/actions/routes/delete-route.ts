import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../auth';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const delete_route = createAction({
    name: 'delete_route',
    auth: simplirouteAuth,
    displayName: 'Delete Route',
    description: 'Delete a route by its ID.',
    audience: 'both',
    aiMetadata: { description: 'Permanently delete a single route identified by its UUID. Use to remove an unwanted or mistaken route; destructive and irreversible. Deleting an already-removed route id simply has no further effect.', idempotent: false },
    props: {
        route_id: Property.ShortText({ 
            displayName: 'route_id', 
            description: 'Route ID to delete (UUID).', 
            required: true 
        }),
    },
    async run(context) {
        const url = `${API_BASE_URL}/v1/routes/routes/${context.propsValue.route_id}/`;
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