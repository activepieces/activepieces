import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { copperAuth } from "../common/auth";
import { copperProps } from "../common/props";
// 👇 Import the new helper functions
import {
    searchPeople,
    searchLeads,
    searchOpportunities,
    searchProjects,
    searchTasks
} from "../common/props";

export const createTask = createAction({
    name: 'create_task',
    auth: copperAuth,
    displayName: 'Create Task',
    description: 'Adds a new task under a person, lead, or opportunity.',
    props: {
        name: Property.ShortText({
            displayName: 'Task Name',
            required: true,
        }),
        assignee_id: copperProps.assigneeId,
        resource_type: Property.StaticDropdown({
            displayName: "Related To Type",
            required: true,
            options: {
                options: [
                    { label: "Person", value: "person" },
                    { label: "Lead", value: "lead" },
                    { label: "Opportunity", value: "opportunity" },
                    { label: "Project", value: "project" },
                    { label: "Task", value: "task" },
                ]
            }
        }),
        resource_id: Property.Dropdown({
            displayName: "Related Record",
            required: true,
            refreshers: ['resource_type'],
            // ✅ CORRECTED LOGIC HERE
            options: async (context) => {
                const auth = context['auth'];
                const resource_type = context['resource_type'] as string;

                if (!auth || !resource_type) {
                    return { disabled: true, options: [], placeholder: "Select a 'Related To Type' first" };
                }

                const authCreds = auth as { email: string, token: string };
                let resources = [];
                switch (resource_type) {
                    case 'person':
                        resources = await searchPeople(authCreds);
                        break;
                    case 'lead':
                        resources = await searchLeads(authCreds);
                        break;
                    case 'opportunity':
                        resources = await searchOpportunities(authCreds);
                        break;
                    case 'project':
                        resources = await searchProjects(authCreds);
                        break;
                    case 'task':
                        resources = await searchTasks(authCreds);
                        break;
                }
                return {
                    options: resources.map((resource: any) => ({
                        label: resource.name,
                        value: resource.id,
                    })),
                };
            }
        }),
        due_date: Property.DateTime({
            displayName: "Due Date",
            required: false,
        }),
        details: Property.LongText({
            displayName: "Details",
            required: false,
        }),
        priority: Property.StaticDropdown({
            displayName: "Priority",
            required: false,
            options: {
                options: [
                    { label: "None", value: "None" },
                    { label: "Low", value: "Low" },
                    { label: "Medium", value: "Medium" },
                    { label: "High", value: "High" },
                ]
            }
        })
    },
    async run(context) {
        // ... run function remains the same ...
        const { name, resource_type, resource_id, due_date, ...otherProps } = context.propsValue;

        const body: Record<string, unknown> = {
            name: name,
            ...otherProps
        };

        if (resource_type && resource_id) {
            body['related_resource'] = {
                id: resource_id,
                type: resource_type,
            };
        }

        if (due_date) {
            body['due_date'] = Math.floor(new Date(due_date).getTime() / 1000);
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.copper.com/developer_api/v1/tasks`,
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