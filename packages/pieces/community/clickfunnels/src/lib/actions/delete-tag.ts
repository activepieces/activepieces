import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { clickfunnelsAuth } from '../common/common';

export const deleteTagAction = createAction({
    // Use the authentication defined in common.ts
    auth: clickfunnelsAuth,
    name: 'delete_tag',
    displayName: 'Delete Tag',
    description: 'Deletes a contact tag from the entire workspace. This will remove the tag from ALL contacts that have it.',
    
    props: {
        subdomain: Property.ShortText({
            displayName: 'Workspace Subdomain',
            description: 'The subdomain of your ClickFunnels workspace (e.g., "myworkspace" from myworkspace.myclickfunnels.com).',
            required: true,
        }),
        tag_id: Property.ShortText({
            displayName: 'Tag ID',
            description: 'The numeric ID of the tag you want to permanently delete.',
            required: true,
        }),
    },

    async run(context) {
        // Destructure properties from the input
        const { 
            subdomain,
            tag_id
        } = context.propsValue;
        
        // Construct the HTTP request
        const request: HttpRequest = {
            method: HttpMethod.DELETE,
            // The URL is built dynamically using the user-provided subdomain and tag ID
            url: `https://${subdomain}.myclickfunnels.com/api/v2/contacts/tags/${tag_id}`,
            headers: {
                'Authorization': `Bearer ${context.auth}`,
            }
        };

        // Send the request. A successful response returns a 204 No Content status.
        await httpClient.sendRequest(request);

        // Return a success message as the response body is empty on success
        return {
            success: true
        };
    },
});