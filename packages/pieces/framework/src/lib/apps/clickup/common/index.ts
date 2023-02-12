import { AuthenticationType } from "../../../common/authentication/core/authentication-type";
import { getAccessTokenOrThrow } from "../../../common/helpers";
import { httpClient } from "../../../common/http/core/http-client";
import { HttpMessageBody } from "../../../common/http/core/http-message-body";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpResponse } from "../../../common/http/core/http-response";
import { OAuth2PropertyValue, Property } from "../../../framework/property";


export const clickupCommon = {
    authentication: Property.OAuth2({
        description: "",
        displayName: 'Authentication',
        authUrl: "https://app.clickup.com/api",
        tokenUrl: "https://app.clickup.com/api/v2/oauth/token",
        required: true,
        scope: []
    }),
    workspace_id: Property.Dropdown({
        description: 'The ID of the ClickUp workspace to create the task in',
        displayName: 'Workspace',
        required: true,
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
    space_id: Property.Dropdown({
        description: 'The ID of the ClickUp space to create the task in',
        displayName: 'Space',
        required: true,
        refreshers: ['authentication', 'workspace_id'],
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
    list_id: Property.Dropdown({
        description: 'The ID of the ClickUp space to create the task in',
        displayName: 'List',
        required: true,
        refreshers: ['authentication', 'space_id'],
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