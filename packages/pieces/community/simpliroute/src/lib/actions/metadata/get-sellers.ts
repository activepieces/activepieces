import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../auth';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_sellers = createAction({
    name: 'get_sellers',
    auth: simplirouteAuth,
    displayName: 'Get Sellers',
    description: 'Retrieve the list of sellers available in the account.',
    audience: 'both',
    aiMetadata: { description: 'List all sellers configured in the account, returning their ids and names. Use to resolve a seller reference before tagging clients or visits with one. Read-only and idempotent; takes no inputs.', idempotent: true },
    props: {},
    async run(context) {
        const url = `${API_BASE_URL}/v1/sellers/`;
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url,
            headers: {
                ...commonHeaders,
                'Authorization': `Token ${context.auth.secret_text}`
            }
        });
        return {
            status: response.status,
            data: response.body
        };
    },
});