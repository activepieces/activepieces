import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest, HttpError } from '@activepieces/pieces-common';
import { clickfunnelsAuth } from '../common/common';

export const getContactAction = createAction({
    // Use the authentication defined in common.ts
    auth: clickfunnelsAuth,
    name: 'get_contact_by_id',
    displayName: 'Get Contact by ID',
    description: "Retrieves the details of a specific contact by their numeric ID.",
    
    props: {
        subdomain: Property.ShortText({
            displayName: 'Workspace Subdomain',
            description: 'The subdomain of your ClickFunnels workspace (e.g., "myworkspace" from myworkspace.myclickfunnels.com).',
            required: true,
        }),
        contact_id: Property.ShortText({
            displayName: 'Contact ID',
            description: "The numeric ID of the contact to retrieve.",
            required: true,
        }),
    },

    async run(context) {
        // Destructure properties from the input
        const { 
            subdomain,
            contact_id
        } = context.propsValue;
        
        // Construct the HTTP request
        const request: HttpRequest = {
            method: HttpMethod.GET,
            // The URL is built dynamically using the user-provided subdomain and contact ID
            url: `https://${subdomain}.myclickfunnels.com/api/v2/contacts/${contact_id}`,
            headers: {
                'Authorization': `Bearer ${context.auth}`,
            }
        };

        try {
            // Send the request and return the response body
            const response = await httpClient.sendRequest(request);
            return response.body;
        } catch (error) {
            // If the contact is not found (404), return null instead of failing the run
            if (error instanceof HttpError && error.response.status === 404) {
                return null;
            }
            // For all other errors, re-throw them
            throw error;
        }
    },
});