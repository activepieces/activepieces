import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const bulk_delete_clients = createAction({
    name: 'bulk_delete_clients',
    auth: simplirouteAuth,
    displayName: 'Bulk Delete Clients',
    description: 'Delete multiple clients in a single call.',
    props: {
        ids: Property.Array({
            displayName: 'IDs',
            description: 'List of client IDs to delete.',
            required: true,
            properties: {
                id: Property.Number({ displayName: 'ID', required: true }),
            }
        }),
    },
    async run(context) {
        const theIds = context.propsValue.ids;
        const body = (theIds as Array<{ id: number }>).map(client => client.id);
        const response = await httpClient.sendRequest({
            method: HttpMethod.DELETE,
            url: `${API_BASE_URL}/v1/accounts/clients/`,
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
