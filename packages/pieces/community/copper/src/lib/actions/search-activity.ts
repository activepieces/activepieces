import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { copperAuth } from "../common/auth";
import { copperProps } from "../common/props";
import {
    searchPeople,
    searchLeads,
    searchOpportunities,
    searchProjects,
    searchTasks,
    searchCompanies,
} from "../common/props";

export const searchActivity = createAction({
    name: 'search_activity',
    auth: copperAuth,
    displayName: 'Search for Activity',
    description: 'Finds an existing activity by ID or other criteria.',
    props: {
        activity_id: Property.ShortText({
            displayName: 'Activity ID',
            description: "If provided, fetches a single activity by its ID and ignores other fields.",
            required: false,
        }),
        parent_type: Property.StaticDropdown({
            displayName: "Parent Record Type",
            description: "Search for activities related to a specific type of record.",
            required: false,
            options: {
                options: [
                    { label: "Person", value: "person" },
                    { label: "Lead", value: "lead" },
                    { label: "Opportunity", value: "opportunity" },
                    { label: "Project", value: "project" },
                    { label: "Company", value: "company" },
                    { label: "Task", value: "task" },
                ]
            }
        }),
        parent_id: Property.Dropdown({
            displayName: "Parent Record",
            required: false,
            refreshers: ['parent_type'],
            options: async (context) => {
                const auth = context['auth'];
                const parent_type = context['parent_type'] as string;
                if (!auth || !parent_type) return { disabled: true, options: [], placeholder: "Select a 'Parent Record Type' first" };
                const authCreds = auth as { email: string, token: string };
                let resources = [];
                switch (parent_type) {
                    case 'person': resources = await searchPeople(authCreds); break;
                    case 'lead': resources = await searchLeads(authCreds); break;
                    case 'opportunity': resources = await searchOpportunities(authCreds); break;
                    case 'project': resources = await searchProjects(authCreds); break;
                    case 'company': resources = await searchCompanies(authCreds); break;
                    case 'task': resources = await searchTasks(authCreds); break;
                }
                return {
                    options: resources.map((resource: any) => ({
                        label: resource.name,
                        value: resource.id,
                    })),
                };
            }
        }),
        activity_type: copperProps.optionalActivityTypeId,
    },
    async run(context) {
        const { activity_id, parent_type, parent_id, activity_type } = context.propsValue;
        const { token, email } = context.auth;

        // Get by ID if provided
        if (activity_id) {
            const response = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `https://api.copper.com/developer_api/v1/activities/${activity_id}`,
                headers: {
                    'X-PW-AccessToken': token,
                    'X-PW-UserEmail': email,
                    'X-PW-Application': 'developer_api',
                    'Content-Type': 'application/json',
                },
            });
            return response.body;
        }

        // Otherwise, search
        const body: Record<string, unknown> = {};
        if (parent_type && parent_id) {
            body['parent'] = { type: parent_type, id: parent_id };
        }
        if (activity_type) {
            const activityTypeObject = JSON.parse(activity_type as string);
            body['activity_types'] = [activityTypeObject];
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.copper.com/developer_api/v1/activities/search`,
            headers: {
                'X-PW-AccessToken': token,
                'X-PW-UserEmail': email,
                'X-PW-Application': 'developer_api',
                'Content-Type': 'application/json',
            },
            body: body,
        });

        return response.body;
    }
});