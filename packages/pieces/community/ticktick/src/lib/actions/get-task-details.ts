import { createAction, Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType, HttpRequest } from "@activepieces/pieces-common";
import { fetchAllProjects } from "../common";
import { ticktickAuth } from "../../index";

export const getTaskDetails = createAction({
    auth: ticktickAuth,
    name: 'get_task_details',
    displayName: 'Get Task Details',
    description: 'Retrieve the details of a specific task in TickTick',
    props: {
        projectId: Property.Dropdown({
            displayName: 'Project',
            description: 'The project the task belongs to.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) return { disabled: true, placeholder: 'Please authenticate first', options: [] };
                const projects = await fetchAllProjects(auth as OAuth2PropertyValue);
                if (projects.length === 0) return { disabled: true, placeholder: 'No projects found.', options: [] };
                return {
                    disabled: false,
                    options: projects.map(p => ({ label: p.name, value: p.id })),
                };
            }
        }),
        taskId: Property.ShortText({
            displayName: 'Task ID',
            description: 'The ID of the task to retrieve',
            required: true,
        }),
    },
    async run(context) {
        const { projectId, taskId } = context.propsValue;
        const authentication = context.auth as OAuth2PropertyValue;

        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `https://api.ticktick.com/open/v1/project/${projectId as string}/task/${taskId}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: authentication.access_token,
            },
            headers: {
                'Content-Type': 'application/json',
            }
        };
        const response = await httpClient.sendRequest(request);
        return response.body;
    },
});
