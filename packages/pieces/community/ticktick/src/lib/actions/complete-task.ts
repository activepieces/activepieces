import { createAction, Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType, HttpRequest } from "@activepieces/pieces-common";
import { fetchAllProjects } from "../common";
import { ticktickAuth } from "../../index";

export const completeTask = createAction({
    auth: ticktickAuth,
    name: 'complete_task',
    displayName: 'Complete Task',
    description: 'Mark an existing task as complete in TickTick',
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
            description: 'The ID of the task to complete',
            required: true,
        }),
    },
    async run(context) {
        const { projectId, taskId } = context.propsValue;
        const authentication = context.auth as OAuth2PropertyValue;

        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `https://api.ticktick.com/open/v1/project/${projectId as string}/task/${taskId}/complete`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: authentication.access_token,
            },
            headers: {
                'Content-Type': 'application/json',
            }
        };
        await httpClient.sendRequest(request);
        return { success: true };
    },
});
