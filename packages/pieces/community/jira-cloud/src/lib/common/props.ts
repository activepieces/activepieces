import { getIssueTypes, getProjects, getUsers, sendJiraRequest } from '.';
import { DropdownOption, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { JiraAuth, jiraCloudAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';

export function getProjectIdDropdown(data?: DropdownParams) {
	return Property.Dropdown({
		displayName: data?.displayName ?? 'Project',
		description: data?.description,
		required: data?.required ?? true,
		refreshers: data?.refreshers ?? [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					options: [],
				};
			}

			const projects = await getProjects(auth as JiraAuth);
			return {
				options: projects.map((project) => {
					return {
						label: project.name,
						value: project.id,
					};
				}),
			};
		},
	});
}

export function getIssueIdDropdown(data?: DropdownParams) {
	return Property.Dropdown({
		displayName: data?.displayName ?? 'Issue ID or Key',
		description: data?.description,
		required: data?.required ?? true,
		refreshers: data?.refreshers ?? [],
		options: async ({ auth, projectId }) => {
			if (!auth || !projectId) {
				return {
					disabled: true,
					options: [],
				};
			}
			let total = 0,
				startAt = 0;
			const options: DropdownOption<string>[] = [];
			do {
				const response = await sendJiraRequest({
					method: HttpMethod.POST,
					url: 'search',
					auth: auth as PiecePropValueSchema<typeof jiraCloudAuth>,
					body: {
						fields: ['summary'],
						jql: `project=${projectId}`,
						startAt: startAt,
						maxResults: 1,
					},
				});
				const issueList = response.body as SearchIssuesResponse;
				options.push(
					...issueList.issues.map((issue) => {
						return {
							label: `[${issue.key}] ${issue.fields.summary}`,
							value: issue.id,
						};
					}),
				);
				startAt = issueList.startAt + issueList.maxResults;
				total = issueList.total;
			} while (startAt < total);

			return {
				disabled: false,
				options,
			};
		},
	});
}

export function getIssueTypeIdDropdown(data?: DropdownParams) {
	return Property.Dropdown({
		displayName: data?.displayName ?? 'Issue Type',
		description: data?.description,
		required: data?.required ?? true,
		refreshers: data?.refreshers ?? ['projectId'],
		options: async ({ auth, projectId }) => {
			if (!auth || !projectId) {
				return {
					options: [],
				};
			}

			const issueTypes = await getIssueTypes({
				auth: auth as JiraAuth,
				projectId: projectId as string,
			});
			return {
				options: issueTypes.map((issueType) => {
					return {
						label: issueType.name,
						value: issueType.id,
					};
				}),
			};
		},
	});
}

export function getUsersDropdown(data?: DropdownParams) {
	return Property.Dropdown({
		displayName: data?.displayName ?? 'User',
		description: data?.description,
		required: data?.required ?? true,
		refreshers: data?.refreshers ?? [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					options: [],
				};
			}

			const users = (await getUsers(auth as JiraAuth)).filter(
				(user) => user.accountType === 'atlassian',
			);
			return {
				options: users.map((user) => {
					return {
						label: user.displayName,
						value: user.accountId,
					};
				}),
			};
		},
	});
}

export interface DropdownParams {
	required?: boolean;
	refreshers?: string[];
	displayName?: string;
	description?: string;
}

export interface SearchIssuesResponse {
	startAt: number;
	maxResults: number;
	total: number;
	issues: Array<{
		id: string;
		key: string;
		fields: {
			summary: string;
		};
	}>;
}
