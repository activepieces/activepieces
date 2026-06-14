import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../auth';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_route = createAction({
    name: 'get_route',
    auth: simplirouteAuth,
    displayName: 'Get Route',
    description: 'Retrieve details of a specific route.',
    audience: 'both',
    aiMetadata: { description: 'Fetch the full details of one route by its UUID, including assigned vehicle, driver and stops. Use when you already have a route id; to find routes by date use Get Routes instead. Read-only and idempotent.', idempotent: true },
    props: {
        route_id: Property.ShortText({ 
            displayName: 'route_id', 
            description: 'Route ID (UUID).', 
            required: true 
        }),
    },
    async run(context) {
        const url = `${API_BASE_URL}/v1/routes/routes/${context.propsValue.route_id}/`;
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
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