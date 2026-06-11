import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../auth';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_clients = createAction({
    name: 'get_clients',
    auth: simplirouteAuth,
    displayName: 'Get Clients',
    description: 'Retrieves the list of clients associated with the account. Can filter by client key.',
    audience: 'both',
    aiMetadata: { description: 'Look up account clients, filtered to the given unique client key. Use to find a client and its stored details (id, address, coordinates, contacts) before creating visits or routes. Read-only and idempotent.', idempotent: true },
    props: {
        key: Property.ShortText({ 
            displayName: 'Client Key', 
            description: 'Unique client key to filter results.', 
            required: true 
        }),
    },
    async run(context) {
        let queryString = '';
        if (context.propsValue.key) {
            queryString += (queryString ? '&' : '?') + 'key=' + context.propsValue.key;
        }
        const url = `${API_BASE_URL}/v1/accounts/clients/${queryString}`;
        console.log(url);
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