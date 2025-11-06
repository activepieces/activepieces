import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_routes = createAction({
    name: 'get_routes',
    auth: simplirouteAuth,
    displayName: 'Get Routes',
    description: 'Retrieve the list of existing routes.',
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
                'Authorization': `Token ${context.auth}`
            }
        });
        return {
            status: response.status,
            data: response.body
        };
    },
});
