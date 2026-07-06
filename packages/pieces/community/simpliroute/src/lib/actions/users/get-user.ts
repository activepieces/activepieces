import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../auth';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_user = createAction({
    name: 'get_user',
    auth: simplirouteAuth,
    displayName: 'Get User',
    description: 'Retrieve information of a specific user by ID.',
    audience: 'both',
    aiMetadata: { description: 'Retrieve a single user/driver by its ID. Read-only and idempotent. Use when you already know the user ID; to list all drivers use the get-drivers action.', idempotent: true },
    props: {
        user_id: Property.Number({ 
            displayName: 'user_id', 
            description: 'User ID.', 
            required: true 
        }),
    },
    async run(context) {
        const url = `${API_BASE_URL}/v1/accounts/drivers/${context.propsValue.user_id}/`;
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