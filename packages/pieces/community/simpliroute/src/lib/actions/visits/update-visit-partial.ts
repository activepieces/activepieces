import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const update_visit_partial = createAction({
    name: 'update_visit_partial',
    auth: simplirouteAuth,
    displayName: 'Update Visit (Partial)',
    description: 'Partially update fields of an existing visit.',
    props: {
        visit_id: Property.Number({ displayName: 'visit_id', description: 'ID of the visit to update.', required: true }),
        title: Property.ShortText({ displayName: 'title', description: 'Visit title (if you want to change it).', required: false }),
        address: Property.ShortText({ displayName: 'address', description: 'Visit address (if you want to change it).', required: false }),
        load: Property.Number({ displayName: 'load', description: 'Visit load (main unit).', required: false }),
        load_2: Property.Number({ displayName: 'load_2', description: 'Visit load (unit 2).', required: false }),
        load_3: Property.Number({ displayName: 'load_3', description: 'Visit load (unit 3).', required: false }),
        duration: Property.ShortText({ displayName: 'duration', description: 'Visit duration (HH:MM:SS).', required: false }),
        contact_name: Property.ShortText({ displayName: 'contact_name', description: 'Visit contact name.', required: false }),
        contact_phone: Property.ShortText({ displayName: 'contact_phone', description: 'Visit contact phone.', required: false }),
        notes: Property.ShortText({ displayName: 'notes', description: 'Visit notes.', required: false }),
        planned_date: Property.ShortText({ displayName: 'planned_date', description: 'Visit planned date (YYYY-MM-DD).', required: false }),
    },
    async run(context) {
        const { visit_id, ...body } = context.propsValue;
        const response = await httpClient.sendRequest({
            method: HttpMethod.PATCH,
            url: `${API_BASE_URL}/v1/routes/visits/${visit_id}/`,
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