import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const delete_route = createAction({
    name: 'delete_route',
    auth: simplirouteAuth,
    displayName: 'Delete Route',
    description: 'Delete a route by its ID.',
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
                'Authorization': `Token ${context.auth}`
            }
        });
        return {
            status: response.status,
            data: response.body
        };
    },
});