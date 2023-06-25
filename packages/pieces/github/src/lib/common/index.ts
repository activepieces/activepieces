import { Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { HttpRequest, HttpMethod, AuthenticationType, httpClient } from "@activepieces/pieces-common";

export const githubCommon = {
    baseUrl: "https://api.github.com",
    repositoryDropdown: Property.Dropdown<{ repo: string, owner: string }>({
        displayName: "Repository",
        refreshers: ['authentication'],
        required: true,
        options: async ({ auth, propsValue }) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "please authenticate first"
                }
            }
            const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
            const repositories = await getUserRepo(authProp);
            return {
                disabled: false,
                options: repositories.map(repo => {
                    return {
                        label: repo.owner.login + "/" + repo.name,
                        value: {
                            owner: repo.owner.login,
                            repo: repo.name
                        }
                    }
                })
            };
        }
    })
}

async function getUserRepo(authProp: OAuth2PropertyValue): Promise<GithubRepository[]> {
    const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${githubCommon.baseUrl}/user/repos`,
        queryParams: {
            per_page: '200'
        },
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: authProp.access_token
        },
    };
    const response = await httpClient.sendRequest<GithubRepository[]>(request);
    return response.body;
}
export interface GithubRepository {
    name: string;
    owner: {
        login: string;
    }
}
