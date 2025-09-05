import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const update_visit = createAction({
    name: 'update_visit',
    auth: simplirouteAuth,
    displayName: 'Update Visit (Complete)',
    description: 'Completely update an existing visit with all fields.',
    props: {
        visit_id: Property.Number({ displayName: 'visit_id', description: 'ID of the visit to update.', required: true }),
        title: Property.ShortText({ displayName: 'title', description: 'Visit title.', required: true }),
        address: Property.ShortText({ displayName: 'address', description: 'Visit address.', required: true }),
        latitude: Property.Number({ displayName: 'latitude', description: 'Visit latitude.', required: false }),
        longitude: Property.Number({ displayName: 'longitude', description: 'Visit longitude.', required: false }),
        load: Property.Number({ displayName: 'load', description: 'Visit load (main unit).', required: false }),
        load_2: Property.Number({ displayName: 'load_2', description: 'Visit load (unit 2).', required: false }),
        load_3: Property.Number({ displayName: 'load_3', description: 'Visit load (unit 3).', required: false }),
        duration: Property.ShortText({ displayName: 'duration', description: 'Visit duration (HH:MM:SS).', required: false }),
        contact_name: Property.ShortText({ displayName: 'contact_name', description: 'Visit contact name.', required: false }),
        contact_phone: Property.ShortText({ displayName: 'contact_phone', description: 'Visit contact phone.', required: false }),
        notes: Property.ShortText({ displayName: 'notes', description: 'Visit notes.', required: false }),
        planned_date: Property.ShortText({ displayName: 'planned_date', description: 'Visit planned date (YYYY-MM-DD).', required: true }),
    },
    async run(context) {
        const { visit_id, ...body } = context.propsValue;
        const response = await httpClient.sendRequest({
            method: HttpMethod.PUT,
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
