import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_user = createAction({
    name: 'get_user',
    auth: simplirouteAuth,
    displayName: 'Get User',
    description: 'Retrieve information of a specific user by ID.',
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
                'Authorization': `Token ${context.auth}`
            }
        });
        return {
            status: response.status,
            data: response.body
        };
    },
});