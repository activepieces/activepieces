import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../auth';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_visit = createAction({
    name: 'get_visit',
    auth: simplirouteAuth,
    displayName: 'Get Visit',
    description: 'Retrieve details of a specific visit by ID.',
    audience: 'both',
    aiMetadata: { description: 'Retrieve a single visit record by its ID. Read-only and idempotent; use for the basic visit fields. For the richer plan-level breakdown use get-visit-detail instead.', idempotent: true },
    props: {
        visit_id: Property.Number({ 
            displayName: 'visit_id', 
            description: 'Visit ID.', 
            required: true 
        }),
    },
    async run(context) {
        const url = `${API_BASE_URL}/v1/routes/visits/${context.propsValue.visit_id}/`;
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