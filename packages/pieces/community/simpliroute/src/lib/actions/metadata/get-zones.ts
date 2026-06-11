import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../auth';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_zones = createAction({
    name: 'get_zones',
    auth: simplirouteAuth,
    displayName: 'Get Zones',
    description: 'Retrieve the list of zones available in the account.',
    audience: 'both',
    aiMetadata: { description: 'List all geographic zones defined in the account, returning their ids and names. Use to resolve a zone reference before assigning it to clients or visits. Read-only and idempotent; takes no inputs.', idempotent: true },
    props: {},
    async run(context) {
        const url = `${API_BASE_URL}/v1/zones/`;
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