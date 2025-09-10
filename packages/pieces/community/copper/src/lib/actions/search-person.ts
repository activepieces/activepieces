import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { copperAuth } from "../common/auth";
import { copperProps } from "../common/props";

export const searchPerson = createAction({
    name: 'search_person',
    auth: copperAuth,
    displayName: 'Search for Person',
    description: 'Finds an existing person by ID or other criteria.',
    props: {
        person_id: Property.ShortText({
            displayName: 'Person ID',
            description: "If provided, fetches a single person by their ID and ignores other fields.",
            required: false,
        }),
        name: Property.ShortText({
            displayName: "Name",
            description: "Search for a person by their full name (exact match).",
            required: false,
        }),
        email: Property.ShortText({
            displayName: "Email",
            description: "Search for a person by their email address.",
            required: false,
        }),
        company_id: copperProps.optionalCompanyId,
        assignee_id: copperProps.assigneeId,
    },
    async run(context) {
        const { person_id, name, email, company_id, assignee_id } = context.propsValue;
        const { token, email: authEmail } = context.auth;

        // Get by ID if provided
        if (person_id) {
            const response = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `https://api.copper.com/developer_api/v1/people/${person_id}`,
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
        if (email) body['emails'] = [email];
        if (company_id) body['company_ids'] = [company_id];
        if (assignee_id) body['assignee_ids'] = [assignee_id];

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.copper.com/developer_api/v1/people/search`,
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