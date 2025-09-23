import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const get_plan_vehicles = createAction({
    name: 'get_plan_vehicles',
    auth: simplirouteAuth,
    displayName: 'Get vehicles with routes on date',
    description: 'Returns the vehicles that have planned routes on the indicated date.',
    props: {
        planned_date: Property.ShortText({ displayName: 'planned_date', description: 'Planned date (YYYY-MM-DD).', required: true }),
    },
    async run(context) {
        const url = `${API_BASE_URL}/v1/plans/${context.propsValue.planned_date}/vehicles/`;
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
