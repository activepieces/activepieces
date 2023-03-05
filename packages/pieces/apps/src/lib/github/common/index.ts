import { Property, OAuth2PropertyValue, HttpRequest, HttpMethod, AuthenticationType, httpClient } from "@activepieces/framework";

export const githubCommon = {
    baseUrl: "https://api.github.com",
    authentication: Property.OAuth2({
        displayName: "Authentication",
        required: true,
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        scope: ['admin:repo_hook', 'admin:org', 'repo'],
    }),
    repositoryDropdown: Property.Dropdown<{ repo: string, owner: string }>({
        displayName: "Repository",
        refreshers: ['authentication'],
        required: true,
        options: async (propsValue) => {
            if (!propsValue['authentication']) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "please authenticate first"
                }
            }
            const authProp: OAuth2PropertyValue = propsValue['authentication'] as OAuth2PropertyValue;
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
