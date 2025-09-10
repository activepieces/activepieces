import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { copperAuth } from "../common/auth";
import { copperProps } from "../common/props";

export const searchLead = createAction({
    name: 'search_lead',
    auth: copperAuth,
    displayName: 'Search for Lead',
    description: 'Finds an existing lead by ID or other criteria.',
    props: {
        lead_id: Property.ShortText({
            displayName: 'Lead ID',
            description: "If provided, fetches a single lead by its ID and ignores other fields.",
            required: false,
        }),
        name: Property.ShortText({
            displayName: "Name",
            description: "Search for a lead by their full name (exact match).",
            required: false,
        }),
        email: Property.ShortText({
            displayName: "Email",
            description: "Search for a lead by their email address.",
            required: false,
        }),
        customer_source_id: copperProps.customerSourceId,
        assignee_id: copperProps.assigneeId,
    },
    async run(context) {
        const { lead_id, name, email, customer_source_id, assignee_id } = context.propsValue;
        const { token, email: authEmail } = context.auth;

        // Get by ID if provided
        if (lead_id) {
            const response = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `https://api.copper.com/developer_api/v1/leads/${lead_id}`,
                headers: {
                    'X-PW-AccessToken': token,
                    'X-PW-UserEmail': authEmail,
                    'X-PW-Application': 'developer_api',
                    'Content-Type': 'application/json',
                },
            });
            // Return as an array to maintain consistency with search results
            return [response.body];
        }

        // Otherwise, search
        const body: Record<string, unknown> = {};
        if (name) body['name'] = name;
        if (email) body['emails'] = email; // Note: Lead search expects a string, not an array
        if (customer_source_id) body['customer_source_ids'] = [customer_source_id];
        if (assignee_id) body['assignee_ids'] = [assignee_id];

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.copper.com/developer_api/v1/leads/search`,
            headers: {
                'X-PW-AccessToken': token,
                'X-PW-UserEmail': authEmail,
                'X-PW-Application': 'developer_api',
                'Content-Type': 'application/json',
            },
            body: body,
        });

        return response.body;
    }
});