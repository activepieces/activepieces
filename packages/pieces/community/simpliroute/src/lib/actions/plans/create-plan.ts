import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const create_plan = createAction({
    name: 'create_plan',
    auth: simplirouteAuth,
    displayName: 'Create an empty plan',
    description: 'Create an empty plan (execution) without routes (reserve a planning day).',
    props: {
        name: Property.ShortText({ displayName: 'name', description: 'Plan name.', required: true }),
        start_date: Property.ShortText({ displayName: 'start_date', description: 'Start date (YYYY-MM-DD).', required: true }),
        end_date: Property.ShortText({ displayName: 'end_date', description: 'End date (YYYY-MM-DD).', required: true }),
    },
    async run(context) {
        const body = context.propsValue;
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${API_BASE_URL}/v1/plans/create-plan/`,
            body,
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