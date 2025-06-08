import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../../index';
import { BASE_URL } from '../common';

export const startTimerAction = createAction({
    auth: clockifyAuth,
    name: 'start-timer',
    displayName: 'Start Timer',
    description: 'Starts a new time entry.',
    props: {
        workspaceId: Property.Dropdown({
            displayName: 'Workspace',
            refreshers: [],
            required: true,
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please connect your account first.',
                    };
                }

                const response = await httpClient.sendRequest<{ id: string; name: string }[]>({
                    method: HttpMethod.GET,
                    url: BASE_URL + '/workspaces',
                    headers: {
                        'X-Api-Key': auth as string,
                    },
                });

                return {
                    disabled: false,
                    options: response.body.map((workspace) => ({
                        label: workspace.name,
                        value: workspace.id,
                    })),
                };
            },
        }),
        description: Property.LongText({
            displayName: 'Entry Description',
            required: false,
        }),
        projectId: Property.Dropdown({
            displayName: 'Project',
            refreshers: ['workspaceId'],
            required: false,
            options: async ({ auth, workspaceId }) => {
                if (!auth || !workspaceId) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please connect your account first.',
                    };
                }

                const response = await httpClient.sendRequest<{ id: string; name: string }[]>({
                    method: HttpMethod.GET,
                    url: BASE_URL + `/workspaces/${workspaceId}/projects`,
                    headers: {
                        'X-Api-Key': auth as string,
                    },
                });

                return {
                    disabled: false,
                    options: response.body.map((project) => ({
                        label: project.name,
                        value: project.id,
                    })),
                };
            },
        }),
        taskId: Property.Dropdown({
            displayName: 'Task',
            refreshers: ['workspaceId', 'projectId'],
            required: false,
            options: async ({ auth, workspaceId, projectId }) => {
                if (!auth || !workspaceId || !projectId) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please connect your account first.',
                    };
                }

                const response = await httpClient.sendRequest<{ id: string; name: string }[]>({
                    method: HttpMethod.GET,
                    url: BASE_URL + `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
                    headers: {
                        'X-Api-Key': auth as string,
                    },
                });

                return {
                    disabled: false,
                    options: response.body.map((task) => ({
                        label: task.name,
                        value: task.id,
                    })),
                };
            },
        }),
        billable: Property.Checkbox({
            displayName: 'Billable',
            required: false,
        }),
        tagIds: Property.MultiSelectDropdown({
            displayName: 'Tags',
            refreshers: ['workspaceId'],
            required: false,
            options: async ({ auth, workspaceId }) => {
                if (!auth || !workspaceId) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please connect your account first.',
                    };
                }

                const response = await httpClient.sendRequest<{ id: string; name: string }[]>({
                    method: HttpMethod.GET,
                    url: BASE_URL + `/workspaces/${workspaceId}/tags`,
                    headers: {
                        'X-Api-Key': auth as string,
                    },
                });

                return {
                    disabled: false,
                    options: response.body.map((tag) => ({
                        label: tag.name,
                        value: tag.id,
                    })),
                };
            },
        }),
    },
    async run(context) {
        const { workspaceId, projectId, description, billable, taskId } =
            context.propsValue;
        const tagIds = context.propsValue.tagIds ?? [];

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: BASE_URL + `/workspaces/${workspaceId}/time-entries`,
            headers: {
                'X-Api-Key': context.auth as string,
            },
            body: {
                billable,
                description,
                start:new Date().toISOString(),
                projectId,
                taskId,
                tagIds,
                type: 'REGULAR',
            },
        });

        return response.body;
    },
});
