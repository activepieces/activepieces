import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_route = createAction({
    name: 'get_route',
    auth: simplirouteAuth,
    displayName: 'Get Route',
    description: 'Retrieve details of a specific route.',
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
                'Authorization': `Token ${context.auth}`
            }
        });
        return {
            status: response.status,
            data: response.body
        };
    },
});