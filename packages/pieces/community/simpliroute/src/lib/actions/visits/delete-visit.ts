import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const delete_visit = createAction({
    name: 'delete_visit',
    auth: simplirouteAuth,
    displayName: 'Delete Visit',
    description: 'Delete a visit by its ID.',
    props: {
        visit_id: Property.Number({ 
            displayName: 'visit_id', 
            description: 'ID of the visit to delete.', 
            required: true 
        }),
    },
    async run(context) {
        const url = `${API_BASE_URL}/v1/routes/visits/${context.propsValue.visit_id}/`;
        const response = await httpClient.sendRequest({
            method: HttpMethod.DELETE,
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