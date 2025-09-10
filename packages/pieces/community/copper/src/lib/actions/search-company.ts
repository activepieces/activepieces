import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { copperAuth } from "../common/auth";
import { copperProps } from "../common/props";

export const searchCompany = createAction({
    name: 'search_company',
    auth: copperAuth,
    displayName: 'Search for Company',
    description: 'Finds an existing company by ID or other criteria.',
    props: {
        company_id: Property.ShortText({
            displayName: 'Company ID',
            description: "If provided, fetches a single company by its ID and ignores other fields.",
            required: false,
        }),
        name: Property.ShortText({
            displayName: "Name",
            description: "Search for a company by its name (exact match).",
            required: false,
        }),
        email_domain: Property.ShortText({
            displayName: "Email Domain",
            description: "Search for a company by its email domain.",
            required: false,
        }),
        assignee_id: copperProps.assigneeId,
    },
    async run(context) {
        const { company_id, name, email_domain, assignee_id } = context.propsValue;
        const { token, email: authEmail } = context.auth;

        // Get by ID if provided
        if (company_id) {
            const response = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `https://api.copper.com/developer_api/v1/companies/${company_id}`,
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
        if (email_domain) body['email_domains'] = [email_domain];
        if (assignee_id) body['assignee_ids'] = [assignee_id];

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.copper.com/developer_api/v1/companies/search`,
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