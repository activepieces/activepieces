import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_skills = createAction({
    name: 'get_skills',
    auth: simplirouteAuth,
    displayName: 'Get Skills',
    description: 'Retrieve the list of skills available in the account.',
    props: {},
    async run(context) {
        const url = `${API_BASE_URL}/v1/routes/skills/`;
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