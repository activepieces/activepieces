import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_plans = createAction({
    name: 'get_plans',
    auth: simplirouteAuth,
    displayName: 'Get Plans',
    description: 'Retrieve the list of saved routing plans (executions).',
    props: {date: Property.ShortText({ displayName: 'date', description: 'Planned date (YYYY-MM-DD).', required: true })},
    async run(context) {
        const url = `${API_BASE_URL}/v1/plans/${context.propsValue.date}/`;
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
