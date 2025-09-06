import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_drivers = createAction({
    name: 'get_drivers',
    auth: simplirouteAuth,
    displayName: 'Get Drivers',
    description: 'Retrieve the list of drivers registered in the account.',
    props: {},
    async run(context) {
        const url = `${API_BASE_URL}/v1/accounts/drivers/`;
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