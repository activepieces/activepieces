import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const delete_vehicle = createAction({
    name: 'delete_vehicle',
    auth: simplirouteAuth,
    displayName: 'Delete Vehicle',
    description: 'Delete a vehicle by its ID.',
    props: {
        vehicle_id: Property.Number({ 
            displayName: 'vehicle_id', 
            description: 'Vehicle ID to delete.', 
            required: true 
        }),
    },
    async run(context) {
        const url = `${API_BASE_URL}/v1/routes/vehicles/${context.propsValue.vehicle_id}/`;
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