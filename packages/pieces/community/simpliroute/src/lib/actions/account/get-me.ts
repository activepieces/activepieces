import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_me = createAction({
    name: 'get_me',
    auth: simplirouteAuth,
    displayName: 'Get Account Details',
    description: 'Returns account information of the authenticated user via API token.',
    props: {},
    async run(context) {
        const url = `${API_BASE_URL}/v1/accounts/me/`;
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