import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const create_vehicle = createAction({
    name: 'create_vehicle',
    auth: simplirouteAuth,
    displayName: 'Create Vehicle',
    description: 'Register a new vehicle in the account.',
    props: {
        name: Property.ShortText({ displayName: 'name', description: 'The name of the vehicle.', required: true }),
        capacity: Property.Number({ displayName: 'capacity', description: 'The maximum capacity of the vehicle.', required: true }),
        default_driver: Property.ShortText({ displayName: 'default_driver', description: 'The assigned driver ID or null if not assigned.', required: false }),
        location_start_address: Property.ShortText({ displayName: 'location_start_address', description: 'The starting address of the vehicle.', required: true }),
        location_start_latitude: Property.Number({ displayName: 'location_start_latitude', description: 'The latitude of the starting location.', required: true }),
        location_start_longitude: Property.Number({ displayName: 'location_start_longitude', description: 'The longitude of the starting location.', required: true }),
        location_end_address: Property.ShortText({ displayName: 'location_end_address', description: 'The ending address of the vehicle.', required: true }),
        location_end_latitude: Property.Number({ displayName: 'location_end_latitude', description: 'The latitude of the ending location.', required: true }),
        location_end_longitude: Property.Number({ displayName: 'location_end_longitude', description: 'The longitude of the ending location.', required: true }),
        skills: Property.Json({ displayName: 'skills', description: 'a list of skill IDs (JSON format [1, 2]).', required: false }),
        capacity2: Property.ShortText({ displayName: 'capacity2', description: 'Secondary vehicle capacity.', required: false }),
        capacity3: Property.ShortText({ displayName: 'capacity3', description: 'Third vehicle capacity.', required: false }),
        cost: Property.ShortText({ displayName: 'cost', description: 'Operational cost of the vehicle.', required: false }),
        shift_start: Property.ShortText({ displayName: 'shift_start', description: 'Start time of the vehicle shift.', required: false }),
        shift_end: Property.ShortText({ displayName: 'shift_end', description: 'End time of the vehicle shift.', required: false }),
        reference_id: Property.ShortText({ displayName: 'reference_id', description: 'External reference ID of the vehicle.', required: false }),
        license_plate: Property.ShortText({ displayName: 'license_plate', description: 'License plate or registration of the vehicle.', required: false }),
        min_load: Property.Number({ displayName: 'min_load', description: 'Minimum load (unit 1) required to dispatch.', required: false }),
        min_load_2: Property.Number({ displayName: 'min_load_2', description: 'Minimum load (unit 2) required.', required: false }),
        min_load_3: Property.Number({ displayName: 'min_load_3', description: 'Minimum load (unit 3) required.', required: false }),
        max_visit: Property.Number({ displayName: 'max_visit', description: 'Maximum number of visits that the vehicle can perform.', required: false }),
        max_time: Property.Number({ displayName: 'max_time', description: 'Maximum duration of route (in seconds).', required: false }),
        rest_time_start: Property.ShortText({ displayName: 'rest_time_start', description: 'Start time of rest.', required: false }),
        rest_time_end: Property.ShortText({ displayName: 'rest_time_end', description: 'End time of rest.', required: false }),
        rest_time_duration: Property.ShortText({ displayName: 'rest_time_duration', description: 'Duration of rest.', required: false }),

    },
    async run(context) {
        const body = context.propsValue;
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${API_BASE_URL}/v1/routes/vehicles/`,
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
