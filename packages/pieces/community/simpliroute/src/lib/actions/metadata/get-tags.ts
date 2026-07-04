import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../auth';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_tags = createAction({
    name: 'get_tags',
    auth: simplirouteAuth,
    displayName: 'Get Tags',
    description: 'Retrieve the list of tags available in the account.',
    audience: 'both',
    aiMetadata: { description: 'List all route tags defined in the account, returning their ids and names. Use to resolve a valid tag reference before applying tags to routes or visits. Read-only and idempotent; takes no inputs.', idempotent: true },
    props: {},
    async run(context) {
        const url = `${API_BASE_URL}/v1/routes/tags/`;
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