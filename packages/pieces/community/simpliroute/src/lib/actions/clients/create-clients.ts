import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../../index';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const create_clients = createAction({
    name: 'create_clients',
    auth: simplirouteAuth,
    displayName: 'Create Clients',
    description: 'Create one or multiple new clients in the account.',
    props: {
        clients: Property.Array({ 
            displayName: 'Clients', 
            description: 'Array of client objects to create.', 
            required: true,
            properties: {
                key: Property.ShortText({ displayName: 'key', description: 'External identifier or unique key for the client.', required: false }),
                title: Property.ShortText({ displayName: 'title', description: 'Name or title of the client.', required: true }),
                address: Property.ShortText({ displayName: 'address', description: 'Client address.', required: false }),
                latitude: Property.Number({ displayName: 'latitude', description: 'Geographic latitude.', required: false }),
                longitude: Property.Number({ displayName: 'longitude', description: 'Geographic longitude.', required: false }),
                load: Property.Number({ displayName: 'load', description: 'Load associated (unit 1).', required: false }),
                load_2: Property.Number({ displayName: 'load_2', description: 'Load associated (unit 2).', required: false }),
                load_3: Property.Number({ displayName: 'load_3', description: 'Load associated (unit 3).', required: false }),
                window_start: Property.ShortText({ displayName: 'window_start', description: 'Preferred time window start (HH:MM:SS).', required: false }),
                window_end: Property.ShortText({ displayName: 'window_end', description: 'Preferred time window end.', required: false }),
                window_start_2: Property.ShortText({ displayName: 'window_start_2', description: 'Second time window start.', required: false }),
                window_end_2: Property.ShortText({ displayName: 'window_end_2', description: 'Second time window end.', required: false }),
                duration: Property.ShortText({ displayName: 'duration', description: 'Estimated visit duration (HH:MM:SS).', required: false }),
                contact_name: Property.ShortText({ displayName: 'contact_name', description: 'Client contact name.', required: false }),
                contact_phone: Property.ShortText({ displayName: 'contact_phone', description: 'Client contact phone.', required: false }),
                contact_email: Property.ShortText({ displayName: 'contact_email', description: 'Client contact email.', required: false }),
                notes: Property.ShortText({ displayName: 'notes', description: 'Additional notes about the client.', required: false }),
                priority_level: Property.Number({ displayName: 'priority_level', description: 'Client priority level.', required: false }),
            }
        }),
    },
    async run(context) {
        const body = context.propsValue.clients;
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
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