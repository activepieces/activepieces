import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';


export const create_route = createAction({
    name: 'create_route',
    auth: simplirouteAuth,
    displayName: 'Create Route',
    description: 'Create a new route manually by assigning vehicle, driver and date.',
    props: {
        vehicle: Property.Number({ displayName: 'vehicle', description: 'Vehicle ID for the route.', required: true }),
        driver: Property.Number({ displayName: 'driver', description: 'Driver ID for the route.', required: true }),
        planned_date: Property.ShortText({ displayName: 'planned_date', description: 'Planned route date (YYYY-MM-DD).', required: true }),
        estimated_time_start: Property.ShortText({ displayName: 'estimated_time_start', description: 'Estimated start time (HH:MM:SS).', required: true }),
        estimated_time_end: Property.ShortText({ displayName: 'estimated_time_end', description: 'Estimated end time (HH:MM:SS).', required: true }),
        location_start_address: Property.ShortText({ displayName: 'location_start_address', description: 'Route start address.', required: true }),
        location_start_latitude: Property.ShortText({ displayName: 'location_start_latitude', description: 'Route start latitude.', required: true }),
        location_start_longitude: Property.ShortText({ displayName: 'location_start_longitude', description: 'Route start longitude.', required: true }),
        location_end_address: Property.ShortText({ displayName: 'location_end_address', description: 'Route end address.', required: true }),
        location_end_latitude: Property.ShortText({ displayName: 'location_end_latitude', description: 'Route end latitude.', required: true }),
        location_end_longitude: Property.ShortText({ displayName: 'location_end_longitude', description: 'Route end longitude.', required: true }),
        plan: Property.ShortText({ displayName: 'plan', description: 'Plan (execution) ID to associate the route (UUID).', required: true }),
    },
    async run(context) {
        const body = context.propsValue;
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${API_BASE_URL}/v1/routes/routes/`,
            body,
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
