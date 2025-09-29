import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const add_visit_items = createAction({
    name: 'add_visit_items',
    auth: simplirouteAuth,
    displayName: 'Add Visit Items',
    description: 'Add items to an existing visit.',
    props: {
        visit_id: Property.Number({ displayName: 'visit_id', description: 'ID of the visit to add items to.', required: true }),
        items: Property.Array({ 
            displayName: 'items', 
            description: 'Array of items to add to the visit.', 
            required: true,
            properties: {
                title: Property.ShortText({ displayName: 'title', description: 'Name or description of the item.', required: true }),
                load: Property.Number({ displayName: 'load', description: 'Unit of load that the item occupies.', required: false }),
                load_2: Property.Number({ displayName: 'load_2', description: 'Second load unit of the item.', required: false }),
                load_3: Property.Number({ displayName: 'load_3', description: 'Third load unit of the item.', required: false }),
                reference: Property.ShortText({ displayName: 'reference', description: 'Internal reference of the item.', required: false }),
                notes: Property.ShortText({ displayName: 'notes', description: 'Additional notes about the item.', required: false }),
                quantity_planned: Property.Number({ displayName: 'quantity_planned', description: 'Planned quantity of the item.', required: false }),
                quantity_delivered: Property.Number({ displayName: 'quantity_delivered', description: 'Delivered quantity of the item (if applicable).', required: false }),
            }
        }),
    },
    async run(context) {
        const { visit_id, ...rest } = context.propsValue;
        const body = rest.items;
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${API_BASE_URL}/v1/routes/visits/${visit_id}/items/`,
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