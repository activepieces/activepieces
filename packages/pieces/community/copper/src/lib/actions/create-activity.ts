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

export const createActivity = createAction({
    name: 'create_activity',
    auth: copperAuth,
    displayName: 'Create Activity',
    description: 'Logs an activity related to a CRM entity.',
    props: {
        parent_type: Property.StaticDropdown({
            displayName: "Parent Record Type",
            required: true,
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
            required: true,
            refreshers: ['parent_type'],
            options: async (context) => {
                const auth = context['auth'];
                const parent_type = context['parent_type'] as string;

                if (!auth || !parent_type) {
                    return { disabled: true, options: [], placeholder: "Select a 'Parent Record Type' first" };
                }
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
        activity_type: copperProps.activityTypeId,
        details: Property.LongText({
            displayName: "Details",
            description: "The content of the activity (e.g., a note, email body).",
            required: true,
        }),
    },
    async run(context) {
        const { parent_type, parent_id, activity_type, details } = context.propsValue;

        const activityTypeObject = JSON.parse(activity_type as string);

        const body = {
            parent: {
                type: parent_type,
                id: parent_id,
            },
            type: {
                category: activityTypeObject.category,
                id: activityTypeObject.id,
            },
            details: details,
        };

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.copper.com/developer_api/v1/activities`,
            headers: {
                'X-PW-AccessToken': context.auth.token,
                'X-PW-UserEmail': context.auth.email,
                'X-PW-Application': 'developer_api',
                'Content-Type': 'application/json',
            },
            body: body
        });

        return response.body;
    }
});