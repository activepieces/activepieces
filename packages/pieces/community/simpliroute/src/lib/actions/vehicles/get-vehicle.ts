import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_vehicle = createAction({
    name: 'get_vehicle',
    auth: simplirouteAuth,
    displayName: 'Get Vehicle',
    description: 'Retrieve information of a specific vehicle.',
    props: {
        vehicle_id: Property.Number({ 
            displayName: 'vehicle_id', 
            description: 'Vehicle ID.', 
            required: true 
        }),
    },
    async run(context) {
        const url = `${API_BASE_URL}/v1/routes/vehicles/${context.propsValue.vehicle_id}/`;
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