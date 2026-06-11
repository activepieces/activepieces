import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../auth';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_plans = createAction({
    name: 'get_plans',
    auth: simplirouteAuth,
    displayName: 'Get Plans',
    description: 'Retrieve the list of saved routing plans (executions).',
    audience: 'both',
    aiMetadata: { description: 'Retrieve the saved routing plans (executions) for a given date. Read-only and idempotent; the date is required, so use it to inspect what plans exist for a specific day.', idempotent: true },
    props: {date: Property.ShortText({ displayName: 'date', description: 'Planned date (YYYY-MM-DD).', required: true })},
    async run(context) {
        const url = `${API_BASE_URL}/v1/plans/${context.propsValue.date}/`;
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
