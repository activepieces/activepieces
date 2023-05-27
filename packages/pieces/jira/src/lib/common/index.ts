import { Property, OAuth2PropertyValue, ActionContext, StaticPropsValue } from "@activepieces/pieces-framework";
import { getAccessTokenOrThrow } from "@activepieces/pieces-common";
import { Version3Client } from 'jira.js';
import { getSites } from "./get-sites";

export function buildClientWithCredentials(accessToken: string, siteId: string): Version3Client {
    const client = new Version3Client({
        host: 'https://api.atlassian.com/ex/jira/' + siteId,
        authentication: {
          oauth2: {
            accessToken
          }
        }
    })
    return client
}

export function buildClient(context: ActionContext<StaticPropsValue<any>>): Version3Client {
    const accessToken = getAccessTokenOrThrow(context.propsValue.authentication)
    return buildClientWithCredentials(accessToken, context.propsValue.site_id)
}

Property

export const jiraCommon = {
    authentication: Property.OAuth2({
        description: "",
        displayName: 'Authentication',
        authUrl: "https://auth.atlassian.com/authorize",
        tokenUrl: "https://auth.atlassian.com/oauth/token",
        required: true,
        scope: ['read:jira-work','write:jira-work','read:me','read:account']
    }),
    site_id: (required = true) => Property.Dropdown({
        description: 'The Jira Site you want to use',
        displayName: 'Jira Site',
        required,
        refreshers: ['authentication'],
        defaultValue: null,
        options: async (value) => {
            if (!value.authentication) {
                return {
                    disabled: true,
                    placeholder: 'connect your account first',
                    options: [],
                };
            }
            const accessToken = getAccessTokenOrThrow(value.authentication as OAuth2PropertyValue);
            const sites = await getSites(accessToken);
            return {
                disabled: false,
                options: sites.map((site) => {
                    return {
                        label: site.name,
                        value: site.id
                    }
                }),
            };
        }
    }),
    project_id: (required = true) => Property.Dropdown({
        description: 'The Project you want to use',
        displayName: 'Project',
        required,
        refreshers: ['authentication', 'site_id'],
        defaultValue: null,
        options: async (value) => {
            if (!value.authentication || !value.site_id) {
                return {
                    disabled: true,
                    placeholder: 'connect your account and choose a site first',
                    options: [],
                };
            }
            const accessToken = getAccessTokenOrThrow(value.authentication as OAuth2PropertyValue);
            const client = buildClientWithCredentials(accessToken, value.site_id as string)
            const projects = await client.projects.getAllProjects()
            return {
                disabled: false,
                options: projects.map((project) => {
                    return {
                        label: project.name,
                        value: project.id
                    }
                }),
            };
        }
    }),
    issue_type: (required = true) => Property.Dropdown({
        description: 'The issue type you want to use',
        displayName: 'Issue Type',
        required,
        refreshers: ['authentication', 'site_id', 'project_id'],
        defaultValue: null,
        options: async (value) => {
            if (!value.authentication || !value.site_id || !value.project_id) {
                return {
                    disabled: true,
                    placeholder: 'connect your account and choose a site and project first',
                    options: [],
                };
            }
            const accessToken = getAccessTokenOrThrow(value.authentication as OAuth2PropertyValue);
            const client = buildClientWithCredentials(accessToken, value.site_id as string)
            const issueTypes = await client.issueTypes.getIssueTypesForProject({
                projectId: (value.project_id as number)
            })
            return {
                disabled: false,
                options: issueTypes.map(issueType => {
                    return {
                        label: issueType.name || '',
                        value: issueType.name
                    };
                })
            };
        }
    })
}