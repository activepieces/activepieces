import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
	HttpRequest,
	HttpMethod,
	AuthenticationType,
	httpClient,
} from '@activepieces/pieces-common';

export const githubCommon = {
	baseUrl: 'https://api.github.com',
	repositoryDropdown: Property.Dropdown<{ repo: string; owner: string }>({
		displayName: 'Repository',
		refreshers: [],
		required: true,
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'please authenticate first',
				};
			}
			const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
			const repositories = await getUserRepo(authProp);
			return {
				disabled: false,
				options: repositories.map((repo) => {
					return {
						label: repo.owner.login + '/' + repo.name,
						value: {
							owner: repo.owner.login,
							repo: repo.name,
						},
					};
				}),
			};
		},
	}),
	assigneeDropDown: (required = false) =>
		Property.MultiSelectDropdown({
			displayName: 'Assignees',
			description: 'Assignees for the Issue',
			refreshers: ['repository'],

			required,
			options: async ({ auth, repository }) => {
				if (!auth || !repository) {
					return {
						disabled: true,
						options: [],
						placeholder: 'please authenticate first and select repo',
					};
				}
				const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
				const { owner, repo } = repository as RepositoryProp;
				const assignees = await getAssignee(authProp, owner, repo);
				return {
					disabled: false,
					options: assignees.map((assignee) => {
						return {
							label: assignee.login,
							value: assignee.login,
						};
					}),
				};
			},
		}),
	labelDropDown: (required = false) =>
		Property.MultiSelectDropdown({
			displayName: 'Labels',
			description: 'Labels for the Issue',
			refreshers: ['repository'],
			required,
			options: async ({ auth, repository }) => {
				if (!auth || !repository) {
					return {
						disabled: true,
						options: [],
						placeholder: 'please authenticate first and select repo',
					};
				}
				const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
				const { owner, repo } = repository as RepositoryProp;
				const labels = await listIssueLabels(authProp, owner, repo);
				return {
					disabled: false,
					options: labels.map((label) => {
						return {
							label: label.name,
							value: label.name,
						};
					}),
				};
			},
		}),
};

async function getUserRepo(authProp: OAuth2PropertyValue): Promise<GithubRepository[]> {
	let page = 1;
	let hasNext;
	const repos: GithubRepository[] = [];
	do {
		const request: HttpRequest = {
			method: HttpMethod.GET,
			url: `${githubCommon.baseUrl}/user/repos`,
			queryParams: {
				page: page.toString(),
				per_page: '100',
			},
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: authProp.access_token,
			},
		};

		const response = await httpClient.sendRequest<GithubRepository[]>(request);
		repos.push(...response.body);

		hasNext = response.headers?.link?.includes('rel="next"');
		page += 1;
	} while (hasNext);

	return repos;
}
async function getAssignee(
	authProp: OAuth2PropertyValue,
	owner: string,
	repo: string,
): Promise<GithubAssignee[]> {
	const request: HttpRequest = {
		method: HttpMethod.GET,
		url: `${githubCommon.baseUrl}/repos/${owner}/${repo}/assignees`,
		queryParams: {
			per_page: '30',
		},
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: authProp.access_token,
		},
	};
	const response = await httpClient.sendRequest<GithubAssignee[]>(request);
	return response.body;
}

async function listIssueLabels(
	authProp: OAuth2PropertyValue,
	owner: string,
	repo: string,
): Promise<GithubIssueLabel[]> {
	const request: HttpRequest = {
		method: HttpMethod.GET,
		url: `${githubCommon.baseUrl}/repos/${owner}/${repo}/labels`,
		queryParams: {
			per_page: '30',
		},
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: authProp.access_token,
		},
	};
	const response = await httpClient.sendRequest<GithubIssueLabel[]>(request);
	return response.body;
}
export interface GithubRepository {
	name: string;
	owner: {
		login: string;
	};
}
export interface GithubAssignee {
	login: string;
}
export interface GithubIssueLabel {
	id: string;
	name: string;
}
export interface RepositoryProp {
	repo: string;
	owner: string;
}
