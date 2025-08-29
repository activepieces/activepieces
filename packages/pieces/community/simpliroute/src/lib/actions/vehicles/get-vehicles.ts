import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_vehicles = createAction({
    name: 'get_vehicles',
    auth: simplirouteAuth,
    displayName: 'Get Vehicles',
    description: 'Retrieve the list of vehicles registered in the account.',
    props: {},
    async run(context) {
        const url = `${API_BASE_URL}/v1/routes/vehicles/`;
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