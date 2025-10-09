import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_zones = createAction({
    name: 'get_zones',
    auth: simplirouteAuth,
    displayName: 'Get Zones',
    description: 'Retrieve the list of zones available in the account.',
    props: {},
    async run(context) {
        const url = `${API_BASE_URL}/v1/zones/`;
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