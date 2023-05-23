import { Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { getAccessTokenOrThrow, HttpMethod, HttpMessageBody, HttpResponse, httpClient, AuthenticationType } from "@activepieces/pieces-common";

export const asanaCommon = {
    authentication: Property.OAuth2({
        description: "",
        displayName: 'Authentication',
        authUrl: "https://app.asana.com/-/oauth_authorize",
        tokenUrl: "https://app.asana.com/-/oauth_token",
        required: true,
        scope: ['default'],
    }),
    workspace: Property.Dropdown({
        description: 'Asana workspace to create the task in',
        displayName: 'Workspace',
        required: true,
        refreshers: ['authentication'],
        options: async (value) => {
            if (!value['authentication']) {
                return {
                    disabled: true,
                    placeholder: 'connect your account first',
                    options: [],
                };
            }
            const accessToken = getAccessTokenOrThrow(value['authentication'] as OAuth2PropertyValue);
            const response = (await callAsanaApi<{
                data: {
                    gid: string,
                    name: string
                }[]
            }>(HttpMethod.GET, "workspaces", accessToken, undefined)).body;
            return {
                disabled: false,
                options: response.data.map((workspace) => {
                    return {
                        label: workspace.name,
                        value: workspace.gid
                    }
                }),
            };
        }
    }),
    project: Property.Dropdown({
        description: 'Asana Project to create the task in',
        displayName: 'Project',
        required: true,
        refreshers: ['authentication', 'workspace'],
        options: async (value) => {
            if (!value['authentication']) {
                return {
                    disabled: true,
                    placeholder: 'connect your account first',
                    options: [],
                };
            }
            if (!value['workspace']) {
                return {
                    disabled: true,
                    placeholder: 'Select workspace first',
                    options: [],
                };
            }
            const accessToken = getAccessTokenOrThrow(value['authentication'] as OAuth2PropertyValue);
            const response = (await callAsanaApi<{
                data: {
                    gid: string,
                    name: string
                }[]
            }>(HttpMethod.GET, "projects?workspace=" + value['workspace'], accessToken, undefined)).body;
            return {
                disabled: false,
                options: response.data.map((project) => {
                    return {
                        label: project.name,
                        value: project.gid
                    }
                }),
            };
        }
    }),
    assignee: Property.Dropdown<string>({
        description: 'Assignee for the task',
        displayName: 'Assignee',
        required: false,
        refreshers: ['authentication', 'workspace'],
        options: async (value) => {
            if (!value['authentication']) {
                return {
                    disabled: true,
                    placeholder: 'connect your account first',
                    options: [],
                };
            }
            if (!value['workspace']) {
                return {
                    disabled: true,
                    placeholder: 'Select workspace first',
                    options: [],
                };
            }
            const accessToken = getAccessTokenOrThrow(value['authentication'] as OAuth2PropertyValue);
            const users = await getUsers(accessToken, value['workspace'] as string);
            return {
                disabled: false,
                options: users.map((user) => {
                    return {
                        label: user.name,
                        value: user.gid
                    }
                }),
            };
        },
    }),
    tags: Property.MultiSelectDropdown<string>({
        description: 'Tags to add to the task',
        displayName: 'Tags',
        required: false,
        refreshers: ['authentication', 'workspace'],
        options: async (value) => {
            if (!value['authentication']) {
                return {
                    disabled: true,
                    placeholder: 'connect your account first',
                    options: [],
                };
            }
            if (!value['workspace']) {
                return {
                    disabled: true,
                    placeholder: 'Select workspace first',
                    options: [],
                };
            }
            const accessToken = getAccessTokenOrThrow(value['authentication'] as OAuth2PropertyValue);
            const response = await getTags(accessToken, value['workspace'] as string);
            return {
                disabled: false,
                options: response.map((project) => {
                    return {
                        label: project.name,
                        value: project.gid
                    }
                }),
            };
        },
    }),
}

export async function getUsers(accessToken: string, workspace: string): Promise<
    {
        gid: string,
        name: string
    }[]>{
    const response = (await callAsanaApi<{
        data: {
            gid: string,
            name: string
        }[]
    }>(HttpMethod.GET, "users?workspace=" + workspace, accessToken, undefined)).body;
    return response.data;
}

export async function getTags(accessToken: string, workspace: string): Promise<
    {
        gid: string,
        name: string
    }[]
> {
    const response = (await callAsanaApi<{
        data: {
            gid: string,
            name: string
        }[]
    }>(HttpMethod.GET, "workspaces/" + workspace + "/tags", accessToken, undefined)).body;
    return response.data;
}

export async function callAsanaApi<T extends HttpMessageBody>(method: HttpMethod, apiUrl: string, accessToken: string, body: any | undefined): Promise<HttpResponse<T>> {
    return await httpClient.sendRequest<T>({
        method: method,
        url: `https://app.asana.com/api/1.0/${apiUrl}`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken
        },
        body: body
    })
}
