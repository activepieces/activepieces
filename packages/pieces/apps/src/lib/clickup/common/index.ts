import { Property, getAccessTokenOrThrow, OAuth2PropertyValue, HttpMethod, HttpMessageBody, HttpResponse, httpClient, AuthenticationType } from "@activepieces/framework";

export const clickupCommon = {
    authentication: Property.OAuth2({
        description: "",
        displayName: 'Authentication',
        authUrl: "https://app.clickup.com/api",
        tokenUrl: "https://app.clickup.com/api/v2/oauth/token",
        required: true,
        scope: []
    }),
    workspace_id: (required = true) => Property.Dropdown({
        description: 'The ID of the ClickUp workspace to create the task in',
        displayName: 'Workspace',
        required,
        refreshers: ['authentication'],
        options: async (value) => {
            if (value['authentication'] === undefined) {
                return {
                    disabled: true,
                    placeholder: 'connect your account first',
                    options: [],
                };
            }
            const accessToken = getAccessTokenOrThrow(value['authentication'] as OAuth2PropertyValue);
            const response = (await callClickUpApi<{
                teams: {
                    id: string,
                    name: string
                }[]
            }>(HttpMethod.GET, "team", accessToken, undefined)).body;
            return {
                disabled: false,
                options: response.teams.map((workspace) => {
                    return {
                        label: workspace.name,
                        value: workspace.id
                    }
                }),
            };
        }
    }),
    space_id: (required = true) => Property.Dropdown({
        description: 'The ID of the ClickUp space to create the task in',
        displayName: 'Space',
        required,
        refreshers: ['authentication', 'workspace_id'],
        defaultValue: null,
        options: async (value) => {
            const { workspace_id, authentication } = value;
            if (authentication === undefined || workspace_id === undefined) {
                return {
                    disabled: true,
                    placeholder: 'connect your account first and select workspace',
                    options: [],
                };
            }
            const accessToken = getAccessTokenOrThrow(authentication as OAuth2PropertyValue);
            const response = (await listSpaces(accessToken, workspace_id as string));
            return {
                disabled: false,
                options: response.spaces.map((space) => {
                    return {
                        label: space.name,
                        value: space.id
                    }
                }),
            };
        }
    }),
    list_id: (required = true) => Property.Dropdown({
        description: 'The ID of the ClickUp space to create the task in',
        displayName: 'List',
        required,
        refreshers: ['authentication', 'space_id'],
        defaultValue: null,
        options: async (value) => {
            const { space_id, authentication } = value;
            if (authentication === undefined || space_id === undefined) {
                return {
                    disabled: true,
                    placeholder: 'connect your account first and space',
                    options: [],
                };
            }
            const accessToken = getAccessTokenOrThrow(authentication as OAuth2PropertyValue);
            const responseFolders = (await listFolders(accessToken, space_id as string));
            const promises: Promise<{ lists: { id: string, name: string }[] }>[] = [
                listFolderlessList(accessToken, space_id as string)
            ];
            for (let i = 0; i < responseFolders.folders.length; ++i) {
                promises.push(listLists(accessToken, responseFolders.folders[i].id));
            }
            const listsResponses = await Promise.all(promises);

            let lists: { name: string, id: string }[] = [];
            for (let i = 0; i < listsResponses.length; ++i) {
                lists = [...lists, ...listsResponses[i].lists];
            }
            return {
                disabled: false,
                options: lists.map((list) => {
                    return {
                        label: list.name,
                        value: list.id
                    }
                }),
            };
        }
    }),
    task_id: (required = true) => Property.Dropdown({
        description: 'The ID of the ClickUp task',
        displayName: 'Task Id',
        required,
        defaultValue: null,
        refreshers: ['authentication', 'list_id'],
        options: async (value) => {
            const { list_id, authentication } = value;
            if (authentication === undefined || list_id === undefined) {
                return {
                    disabled: true,
                    placeholder: 'connect your account first and select workspace',
                    options: [],
                };
            }
            const accessToken = getAccessTokenOrThrow(authentication as OAuth2PropertyValue);
            const response = (await listTasks(accessToken, list_id as string));
            return {
                disabled: false,
                options: response.tasks.map((task) => {
                    return {
                        label: task.name,
                        value: task.id
                    }
                }),
            };
        }
    }),
    folder_id: (required = false) => Property.Dropdown({
        description: 'The ID of the ClickUp folder',
        displayName: 'Task Id',
        refreshers: ['authentication', 'space_id'],
        defaultValue: null,
        required,
        options: async (value) => {
            const { space_id, authentication } = value;
            if (authentication === undefined || space_id === undefined) {
                return {
                    disabled: true,
                    placeholder: 'connect your account first and select workspace',
                    options: [],
                };
            }
            const accessToken = getAccessTokenOrThrow(authentication as OAuth2PropertyValue);
            const response = (await listFolders(accessToken, space_id as string));
            return {
                disabled: false,
                options: response.folders.map((task) => {
                    return {
                        label: task.name,
                        value: task.id
                    }
                }),
            };
        }
    })
}

async function listSpaces(accessToken: string, workspaceId: string) {
    return (await callClickUpApi<{
        spaces: {
            id: string,
            name: string
        }[]
    }>(HttpMethod.GET, `team/${workspaceId}/space`, accessToken, undefined)).body;
}

async function listLists(accessToken: string, folderId: string) {
    return (await callClickUpApi<{
        lists: {
            id: string,
            name: string
        }[]
    }>(HttpMethod.GET, `folder/${folderId}/list`, accessToken, undefined)).body;
}

async function listFolders(accessToken: string, spaceId: string) {
    return (await callClickUpApi<{
        folders: {
            id: string,
            name: string
        }[]
    }>(HttpMethod.GET, `space/${spaceId}/folder`, accessToken, undefined)).body;
}

async function listFolderlessList(accessToken: string, spaceId: string) {
    return (await callClickUpApi<{
        lists: {
            id: string,
            name: string
        }[]
    }>(HttpMethod.GET, `space/${spaceId}/list`, accessToken, undefined)).body;
}

async function listTasks(accessToken: string, listId: string) {
    return (await callClickUpApi<{
        tasks: {
            id: string,
            name: string
        }[]
    }>(HttpMethod.GET, `list/${listId}/task`, accessToken, undefined)).body;
}


export async function callClickUpApi<T extends HttpMessageBody>(method: HttpMethod, apiUrl: string, accessToken: string, body: any | undefined): Promise<HttpResponse<T>> {
    return await httpClient.sendRequest<T>({
        method: method,
        url: `https://api.clickup.com/api/v2/${apiUrl}`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken
        },
        body: body
    });
}
