import {createTrigger, TriggerStrategy} from "../../../framework/trigger/trigger";
import {httpClient} from "../../../common/http/core/http-client";
import {HttpRequest} from "../../../common/http/core/http-request";
import {HttpMethod} from "../../../common/http/core/http-method";
import {AuthenticationType} from "../../../common/authentication/core/authentication-type";
import {AuthPropertyValue, Props} from "../../../framework/property/prop.model";
import {GithubRepository} from "../common/repository.interface";


export const githubNewRepoEvent = createTrigger({
    name: 'new_repo_event',
    displayName: "New Repository Event",
    description: 'Triggers when there is new event on the repository',
    props: {
        authentication: Props.OAuth2({
            displayName: "Authentication",
            required: true,
            authUrl: '',
            tokenUrl: '',
            scope: [],
        }),
        repository: Props.Dropdown<{ repo: string, owner: string }>({
            displayName: "Repository",
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
                    url: `https://api.github.com/user/repos?per_page=100`,
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
        }),
        events: Props.Dropdown({
            displayName: "Event",
            description: "List of repository events",
            required: true,
            options: async (request) => {
                return {
                    disabled: false,
                    options: [
                        {
                            label: 'New star',
                            value: ['star']
                        }
                    ]
                }
            }
        })
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const {repo, owner} = context.propsValue['repository']!;
        const request: HttpRequest<any> = {
            method: HttpMethod.POST,
            url: `https://api.github.com/repos/${owner}/${repo}/hooks`,
            body: {
                owner: owner,
                repo: repo,
                name: 'Activepieces Hooks',
                active: true,
                events: context.propsValue['events'],
                config: {
                    url: context.webhookUrl,
                    content_type: 'json',
                    insecure_ssl: '0'
                }
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.propsValue['authentication']!['access_token'],
            },
            queryParams: {},
        };
        let webhook = await httpClient.sendRequest<{ id: string }>(request);
        await context.store?.save<WebhookInformation>("_trigger", {
            webhookId: webhook.id,
            owner: owner,
            repo: repo
        });
    },
    async onDisable(context) {
        const {owner, repo, webhookId} = await context.store?.get<WebhookInformation>("_trigger")!;
        const request: HttpRequest<never> = {
            method: HttpMethod.DELETE,
            url: `https://api.github.com/repos/${owner}/${repo}/hooks/${webhookId}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.propsValue['authentication']!['access_token'],
            },
        };
        await httpClient.sendRequest(request);
    },
    async run(context) {
        return [context.payload];
    },
});

interface WebhookInformation {
    webhookId: string;
    repo: string;
    owner: string;
}