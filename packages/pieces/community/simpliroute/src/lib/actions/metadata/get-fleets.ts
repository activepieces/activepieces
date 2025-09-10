import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_fleets = createAction({
    name: 'get_fleets',
    auth: simplirouteAuth,
    displayName: 'Get Fleets',
    description: 'Retrieve the list of fleets available in the account.',
    props: {},
    async run(context) {
        const url = `${API_BASE_URL}/v1/fleets/`;
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