import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../auth';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_routes = createAction({
    name: 'get_routes',
    auth: simplirouteAuth,
    displayName: 'Get Routes',
    description: 'Retrieve the list of existing routes.',
    audience: 'both',
    aiMetadata: { description: 'List all routes planned for a given date (YYYY-MM-DD), returning each route with its assigned vehicle, driver and stops. Use to review or pick routes for a specific day; for a single known route id use Get Route instead. Read-only and idempotent.', idempotent: true },
    props: {planned_date: Property.ShortText({ displayName: 'planned_date', description: 'Visit planned date (YYYY-MM-DD).', required: true })},
    async run(context) {
        const body = context.propsValue;
        const url = `${API_BASE_URL}/v1/routes/routes/?planned_date=${body.planned_date}`;
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: url,
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
