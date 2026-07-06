import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../auth';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_visits = createAction({
    name: 'get_visits',
    auth: simplirouteAuth,
    displayName: 'Get Visits',
    description: 'Retrieve all registered visits. Can be filtered by planned visit date.',
    audience: 'both',
    aiMetadata: { description: 'List registered visits filtered by planned date. Read-only and idempotent; use to enumerate the visits scheduled for a day. For a single visit by ID use the get-visit or get-visit-detail action instead.', idempotent: true },
    props: {
        planned_date: Property.ShortText({ 
            displayName: 'planned_date', 
            description: 'Filter visits by planned date (YYYY-MM-DD format).', 
            required: true 
        }),
    },
    async run(context) {
        let queryString = '';
        if (context.propsValue.planned_date) {
            queryString += (queryString ? '&' : '?') + 'planned_date=' + context.propsValue.planned_date;
        }
        const url = `${API_BASE_URL}/v1/routes/visits/${queryString}`;
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