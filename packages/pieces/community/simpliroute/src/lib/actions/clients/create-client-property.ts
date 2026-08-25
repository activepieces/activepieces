import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplirouteAuth } from '../../auth';
import { API_BASE_URL, commonHeaders } from '../../common/constants';

export const create_client_property = createAction({
    name: 'create_client_property',
    auth: simplirouteAuth,
    displayName: 'Create Client Custom Property',
    description: 'Create a new custom attribute for clients.',
    audience: 'both',
    aiMetadata: { description: 'Define a new custom property (str, int, float or bool) on the client schema so subsequent client records can store that attribute. Use when an attribute you need does not yet exist on clients; not idempotent (each call adds another property definition).', idempotent: false },
    props: {
        label: Property.ShortText({ 
            displayName: 'label', 
            description: 'Label of the new custom property.', 
            required: true 
        }),
        type: Property.ShortText({ 
            displayName: 'type', 
            description: 'Property type (str, int, float or bool).', 
            required: true 
        }),
    },
    async run(context) {
        const body = context.propsValue;
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${API_BASE_URL}/v1/planner/client-properties/`,
            body,
            headers: {
                ...commonHeaders,
                'Authorization': `Token ${context.auth.secret_text}`
            }
        });
        return {
            status: response.status,
            data: response.body
        };
    },
});