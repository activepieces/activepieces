import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { copperAuth } from "../common/auth";
import { copperProps } from "../common/props";

export const searchProject = createAction({
    name: 'search_project',
    auth: copperAuth,
    displayName: 'Search for Project',
    description: 'Finds an existing project by ID or other criteria.',
    props: {
        project_id: Property.ShortText({
            displayName: 'Project ID',
            description: "If provided, fetches a single project by its ID and ignores other fields.",
            required: false,
        }),
        name: Property.ShortText({
            displayName: "Name",
            description: "Search for a project by its name (exact match).",
            required: false,
        }),
        assignee_id: copperProps.assigneeId,
    },
    async run(context) {
        const { project_id, name, assignee_id } = context.propsValue;
        const { token, email: authEmail } = context.auth;

        // Get by ID if provided
        if (project_id) {
            const response = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `https://api.copper.com/developer_api/v1/projects/${project_id}`,
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
        if (assignee_id) body['assignee_ids'] = [assignee_id];

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.copper.com/developer_api/v1/projects/search`,
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