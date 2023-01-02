import {AuthPropertyValue, Property} from "../../../framework/property/prop.model";
import {HttpRequest} from "../../../common/http/core/http-request";
import {HttpMethod} from "../../../common/http/core/http-method";
import {AuthenticationType} from "../../../common/authentication/core/authentication-type";
import {httpClient} from "../../../common/http/core/http-client";

export const githubCommon = {
    baseUrl:  "https://api.github.com",
    authentication: Property.OAuth2({
        displayName: "Authentication",
        required: true,
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        scope: ['write:repo_hook'],
    }),
    repositoryDropdown: Property.Dropdown<{ repo: string, owner: string }>({
        displayName: "Repository",
        refreshers: ['authentication'],
        required: true,
        options: async (propsValue) => {
            if (propsValue['authentication'] === undefined) {
                return {
                    disabled: true,
                    options: []
                }
            }
            const authProp: AuthPropertyValue = propsValue['authentication'] as AuthPropertyValue;
            const request: HttpRequest<never> = {
                method: HttpMethod.GET,
                url: `${githubCommon.baseUrl}/user/repos?per_page=100`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: authProp.access_token
                },
            };
            let repositories = await httpClient.sendRequest<GithubRepository[]>(request);
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

export interface GithubRepository {
    name: string;
    owner: {
        login: string;
    }
}
