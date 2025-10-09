import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const create_visits = createAction({
    name: 'create_visits',
    auth: simplirouteAuth,
    displayName: 'Create Visits',
    description: 'Create visits. Multiple visits can be created in a single request.',
    props: {
        visits: Property.Array({
            displayName: 'visits',
            description: 'Array of visit objects to create.',
            required: true,
            properties: {
                title: Property.ShortText({ displayName: 'title', description: "String to identify the delivery. Usually company or person's name.", required: true }),
                address: Property.ShortText({ displayName: 'address', description: 'Address text. Best practice is to use Googlemaps format.', required: true }),
                planned_date: Property.ShortText({ displayName: 'planned_date', description: 'Date when the visit will be delivered. (YYYY-MM-DD)', required: true }),
                latitude: Property.Number({ displayName: 'latitude', description: "Visit's latitude location.", required: false }),
                longitude: Property.Number({ displayName: 'longitude', description: "Visit's longitude location.", required: false }),
                load: Property.Number({ displayName: 'load', description: 'Space of the truck that visit uses.', required: true, defaultValue: 1 }),
                load_2: Property.Number({ displayName: 'load_2', description: 'Space of the truck that visit uses.', required: false }),
                load_3: Property.Number({ displayName: 'load_3', description: 'Space of the truck that visit uses.', required: false }),
                window_start: Property.ShortText({ displayName: 'window_start', description: 'Initial Hour when the visit can be visit (HH:MM:SS).', required: false }),
                window_end: Property.ShortText({ displayName: 'window_end', description: 'Final Hour when the visit can be visit (HH:MM:SS).', required: false }),
                window_start_2: Property.ShortText({ displayName: 'window_start_2', description: 'Initial Hour when the visit can be visit (HH:MM:SS).', required: false }),
                window_end_2: Property.ShortText({ displayName: 'window_end_2', description: 'Final Hour when the visit can be visit (HH:MM:SS).', required: false }),
                duration: Property.ShortText({ displayName: 'duration', description: 'Time spent in the delivery (HH:mm:ss).', required: false }),
                order: Property.Number({ displayName: 'order', description: 'Visit order when the visit already belongs to a delivery route.', required: false }),
                skills_required: Property.Json({ displayName: 'skills_required', description: 'A list of skills or capabilities required (JSON format [1, 2]).', required: false }),
                skills_optional: Property.Json({ displayName: 'skills_optional', description: 'A list of skills or capabilities optionals (JSON format [1, 2]).', required: false }),
                tags: Property.Json({ displayName: 'tags', description: 'A list of tags (JSON format [1, 2]).', required: false }),
                contact_name: Property.ShortText({ displayName: 'contact_name', description: 'Name of who will receive the delivery.', required: false }),
                contact_phone: Property.ShortText({ displayName: 'contact_phone', description: 'Phone of who will receive the delivery.', required: false }),
                contact_email: Property.ShortText({ displayName: 'contact_email', description: 'E-mail of who will receive the delivery.', required: false }),
                reference: Property.ShortText({ displayName: 'reference', description: 'Reference or internal identifier of the company. Example: Invoice or order number.', required: false }),
                notes: Property.ShortText({ displayName: 'notes', description: 'Information to help the driver.', required: false }),
                priority_level: Property.Number({ displayName: 'priority_level', description: 'If the visit is more important than others. It goes from 1 to 5.', required: false }),
                visit_type: Property.ShortText({ displayName: 'visit_type', description: 'Visit type associated with the visit.', required: false }),
                fleet: Property.Number({ displayName: 'fleet', description: 'Fleet ID.', required: false }),
            }
        }),
    },
    async run(context) {
        const body = context.propsValue.visits;
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${API_BASE_URL}/v1/routes/visits/`,
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
