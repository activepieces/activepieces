import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { clickfunnelsAuth } from '../common/common';

export const createTagAction = createAction({
    // Use the authentication defined in common.ts
    auth: clickfunnelsAuth,
    name: 'create_tag',
    displayName: 'Create Tag',
    description: 'Creates a new contact tag within a workspace.',
    
    props: {
        subdomain: Property.ShortText({
            displayName: 'Workspace Subdomain',
            description: 'The subdomain of your ClickFunnels workspace (e.g., "myworkspace" from myworkspace.myclickfunnels.com).',
            required: true,
        }),
        workspace_id: Property.Number({
            displayName: 'Workspace ID',
            description: 'The ID of the workspace where the tag will be created.',
            required: true,
        }),
        name: Property.ShortText({
            displayName: 'Tag Name',
            description: 'The name of the tag you want to create (e.g., "Webinar-Registered").',
            required: true,
        }),
        color: Property.ShortText({
            displayName: 'Tag Color',
            description: 'The hex color code for the tag.',
            required: true,
            defaultValue: '#4485fe' // A default blue color
        }),
    },

    async run(context) {
        // Destructure properties from the input
        const { 
            subdomain,
            workspace_id, 
            name, 
            color
        } = context.propsValue;
        
        // Construct the HTTP request
        const request: HttpRequest = {
            method: HttpMethod.POST,
            // The URL is built dynamically using the user-provided subdomain and workspace ID
            url: `https://${subdomain}.myclickfunnels.com/api/v2/workspaces/${workspace_id}/contacts/tags`,
            headers: {
                'Authorization': `Bearer ${context.auth}`,
                'Content-Type': 'application/json',
            },
            body: {
                // As per the API docs, the payload is nested within a 'contacts_tag' object
                contacts_tag: {
                    name,
                    color,
                }
            }
        };

        // Send the request and return the response body
        const response = await httpClient.sendRequest(request);
        return response.body;
    },
});