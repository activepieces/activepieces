import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../auth';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const create_plan = createAction({
    name: 'create_plan',
    auth: simplirouteAuth,
    displayName: 'Create an empty plan',
    description: 'Create an empty plan (execution) without routes (reserve a planning day).',
    audience: 'both',
    aiMetadata: { description: 'Create a new empty routing plan (execution) for a given date range, reserving a planning day before routes are added. Not idempotent: each call creates a separate plan, so guard against duplicate plans for the same date.', idempotent: false },
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
                'Authorization': `Token ${context.auth.secret_text}`
            }
        });
        return {
            status: response.status,
            data: response.body
        };
    },
});