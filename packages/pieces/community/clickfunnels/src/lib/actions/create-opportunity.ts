import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { clickfunnelsAuth } from '../common/common';

export const createOpportunityAction = createAction({
    // Use the authentication defined in common.ts
    auth: clickfunnelsAuth,
    name: 'create_opportunity',
    displayName: 'Create Opportunity',
    description: 'Create a new opportunity for a contact.',
    
    props: {
        subdomain: Property.ShortText({
            displayName: 'Workspace Subdomain',
            description: 'The subdomain of your ClickFunnels workspace (e.g., "myworkspace" from myworkspace.myclickfunnels.com).',
            required: true,
        }),
        workspace_id: Property.Number({
            displayName: 'Workspace ID',
            description: 'The ID of the workspace where the opportunity will be created.',
            required: true,
        }),
        name: Property.ShortText({
            displayName: 'Opportunity Name',
            description: 'The name or title of the opportunity.',
            required: true,
        }),
        primary_contact_id: Property.Number({
            displayName: 'Primary Contact ID',
            description: 'The numeric ID of the contact to associate with this opportunity.',
            required: true,
        }),
        pipelines_stage_id: Property.Number({
            displayName: 'Pipeline Stage ID',
            description: 'The numeric ID of the pipeline stage for this opportunity.',
            required: true,
        }),
        value: Property.Number({
            displayName: 'Value',
            description: 'The potential monetary value of this opportunity.',
            required: false,
        }),
        closed_at: Property.DateTime({
            displayName: 'Close Date',
            description: 'The expected close date for the opportunity.',
            required: false,
        }),
    },

    async run(context) {
        // Destructure properties from the input
        const { 
            subdomain,
            workspace_id, 
            name, 
            primary_contact_id, 
            pipelines_stage_id, 
            value, 
            closed_at 
        } = context.propsValue;
        
        // Prepare the data payload for the API
        const opportunityData = {
            name,
            primary_contact_id,
            pipelines_stage_id,
            value,
            closed_at,
        };
        
        // Construct the HTTP request
        const request: HttpRequest = {
            method: HttpMethod.POST,
            // The URL is built dynamically using the user-provided subdomain and workspace ID
            url: `https://${subdomain}.myclickfunnels.com/api/v2/workspaces/${workspace_id}/sales/opportunities`,
            headers: {
                'Authorization': `Bearer ${context.auth}`,
                'Content-Type': 'application/json',
            },
            body: {
                // As per the API docs, the payload is nested within a 'sales_opportunity' object
                sales_opportunity: opportunityData
            }
        };

        // Send the request and return the response body
        const response = await httpClient.sendRequest(request);
        return response.body;
    },
});