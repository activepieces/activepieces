import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../auth';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_fleets = createAction({
    name: 'get_fleets',
    auth: simplirouteAuth,
    displayName: 'Get Fleets',
    description: 'Retrieve the list of fleets available in the account.',
    audience: 'both',
    aiMetadata: { description: 'List all fleets configured in the account, returning their ids and names. Use to resolve a valid fleet reference before grouping vehicles or filtering planning by fleet. Read-only and idempotent; takes no inputs.', idempotent: true },
    props: {},
    async run(context) {
        const url = `${API_BASE_URL}/v1/fleets/`;
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