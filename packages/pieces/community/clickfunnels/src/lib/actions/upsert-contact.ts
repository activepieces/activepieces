import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { clickfunnelsAuth } from '../common/common';

export const upsertContactAction = createAction({
    // Use the authentication defined in common.ts
    auth: clickfunnelsAuth,
    name: 'upsert_contact',
    displayName: 'Create or Update Contact (Upsert)',
    description: 'Creates a new contact if one does not exist with the given email, or updates the existing contact if it does.',
    
    props: {
        subdomain: Property.ShortText({
            displayName: 'Workspace Subdomain',
            description: 'The subdomain of your ClickFunnels workspace (e.g., "myworkspace" from myworkspace.myclickfunnels.com).',
            required: true,
        }),
        workspace_id: Property.Number({
            displayName: 'Workspace ID',
            description: 'The ID of the workspace for this contact.',
            required: true,
        }),
        email_address: Property.ShortText({
            displayName: 'Email',
            description: "The contact's email address. This is used to find and update the contact.",
            required: true,
        }),
        first_name: Property.ShortText({
            displayName: 'First Name',
            required: false,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            required: false,
        }),
        phone_number: Property.ShortText({
            displayName: 'Phone Number',
            required: false,
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'An array of tag names to apply to the contact.',
            required: false,
        }),
        custom_attributes: Property.Object({
            displayName: 'Custom Attributes',
            description: 'A key-value object for custom contact data.',
            required: false,
        })
    },

    async run(context) {
        // Destructure properties from the input
        const { 
            subdomain,
            workspace_id,
            ...contactData // Collect all other props into contactData
        } = context.propsValue;

        // The API expects an array of objects for tags, so we map the string array
        if (contactData.tags) {
            contactData.tags = (contactData.tags as string[]).map(tagName => ({ name: tagName }));
        }
        
        // Remove undefined properties to avoid sending empty values
        Object.keys(contactData).forEach(key => 
            (contactData as Record<string, unknown>)[key] === undefined && delete (contactData as Record<string, unknown>)[key]
        );
        
        // Construct the HTTP request
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `https://${subdomain}.myclickfunnels.com/api/v2/workspaces/${workspace_id}/contacts/upsert`,
            headers: {
                'Authorization': `Bearer ${context.auth}`,
                'Content-Type': 'application/json',
            },
            body: {
                // As per the API docs, the payload is nested within a 'contact' object
                contact: contactData
            }
        };

        // Send the request and return the response body
        const response = await httpClient.sendRequest(request);
        return response.body;
    },
});