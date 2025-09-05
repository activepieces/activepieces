import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_visit_detail = createAction({
    name: 'get_visit_detail',
    auth: simplirouteAuth,
    displayName: 'Get Visit Detail',
    description: 'Get detailed information about a specific visit.',
    props: {
        visit_id: Property.Number({ 
            displayName: 'visit_id', 
            description: 'ID of the visit to get details for.', 
            required: true 
        }),
    },
    async run(context) {
        const url = `${API_BASE_URL}/v1/plans/visits/${context.propsValue.visit_id}/detail/`;
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