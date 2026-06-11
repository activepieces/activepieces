import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../auth';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_drivers = createAction({
    name: 'get_drivers',
    auth: simplirouteAuth,
    displayName: 'Get Drivers',
    description: 'Retrieve the list of drivers registered in the account.',
    audience: 'both',
    aiMetadata: { description: 'List all drivers/users registered in the account. Read-only and idempotent; takes no input. Use to discover user IDs before fetching, updating, or assigning a specific driver.', idempotent: true },
    props: {},
    async run(context) {
        const url = `${API_BASE_URL}/v1/accounts/drivers/`;
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