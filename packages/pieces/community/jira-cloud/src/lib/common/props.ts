import {
	getIssueTypes,
	getProjects,
	getUsers,
	jiraApiCall,
	jiraPaginatedApiCall,
	sendJiraRequest,
} from '.';
import {
	DropdownOption,
	DynamicPropsValue,
	PiecePropValueSchema,
	Property,
} from '@activepieces/pieces-framework';
import { JiraAuth, jiraCloudAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { IssueFieldMetaData, IssueTypeMetadata } from './types';

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

async function fetchProjectVersionsOptions(
	auth: PiecePropValueSchema<typeof jiraCloudAuth>,
	projectId: string,
): Promise<DropdownOption<string>[]> {
	const response = await jiraApiCall<Array<{ id: string; name: string }>>({
		domain: auth.instanceUrl,
		username: auth.email,
		password: auth.apiToken,
		method: HttpMethod.GET,
		resourceUri: `/project/${projectId}/versions`,
	});

	const options: DropdownOption<string>[] = [];
	for (const version of response) {
		options.push({
			value: version.id,
			label: version.name,
		});
	}

	return options;
}

async function fetchUsersOptions(
	auth: PiecePropValueSchema<typeof jiraCloudAuth>,
	projectId: string,
): Promise<DropdownOption<string>[]> {
	const response = (await getUsers(auth)) as Array<{
		accountId: string;
		accountType: string;
		displayName: string;
	}>;

	const options = response
		.filter((user) => user.accountType === 'atlassian')
		.map((user) => {
			return {
				label: user.displayName,
				value: user.accountId,
			};
		});

	return options;
}

export const issueTypeIdProp = (displayName: string, required = true) =>
	Property.Dropdown({
		displayName,
		refreshers: [],
		required,
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your account first',
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof jiraCloudAuth>;
			const response = await jiraPaginatedApiCall<IssueTypeMetadata, 'issueTypes'>({
				domain: authValue.instanceUrl,
				username: authValue.email,
				password: authValue.apiToken,
				resourceUri: `/issue/createmeta/BP/issuetypes`,
				propertyName: 'issueTypes',
				method: HttpMethod.GET,
			});

			const options: DropdownOption<string>[] = [];

			for (const issueType of response) {
				options.push({
					value: issueType.id,
					label: issueType.name,
				});
			}

			return {
				disabled: false,
				options,
			};
		},
	});

function createPropertyDefination(property: IssueFieldMetaData) {
	switch (property.schema.type) {
		case 'string':
			return Property.LongText({
				displayName: property.name,
				required: property.required,
			});
		case 'date':
			return Property.DateTime({
				displayName: property.name,
				description: 'Provide date in YYYY-MM-DD format.',
				required: property.required,
			});
		case 'datetime':
			return Property.DateTime({
				displayName: property.name,
				required: property.required,
			});
		case 'number':
			return Property.Number({
				displayName: property.name,
				required: property.required,
			});
		case 'option':
			return Property.StaticDropdown({
				displayName: property.name,
				required: property.required,
				options: {
					disabled: false,
					options: property.allowedValues
						? property.allowedValues.map((option) => ({ label: option.value, value: option.value }))
						: [],
				},
			});
		default:
			return null;
	}
}

export const issueFieldsProp = Property.DynamicProperties({
	displayName: 'Fields',
	required: true,
	refreshers: ['projectId', 'issueTypeId'],
	props: async ({ auth, projectId, issueTypeId }) => {
		if (!auth || !issueTypeId || !projectId) {
			return {};
		}

		const props: DynamicPropsValue = {};

		const authValue = auth as PiecePropValueSchema<typeof jiraCloudAuth>;
		const fields = await jiraPaginatedApiCall<IssueFieldMetaData, 'fields'>({
			domain: authValue.instanceUrl,
			username: authValue.email,
			password: authValue.apiToken,
			method: HttpMethod.GET,
			resourceUri: `/issue/createmeta/${projectId}/issuetypes/${issueTypeId}`,
			propertyName: 'fields',
		});

		if (!fields || !Array.isArray(fields)) return {};

		for (const field of fields) {
			if (field.schema.type === 'user') {
				const userOptions = await fetchUsersOptions(authValue, projectId as unknown as string);
				props[field.key] = Property.StaticDropdown({
					displayName: field.name,
					required: field.required,
					options: {
						disabled: false,
						options: userOptions,
					},
				});
			} else if (field.schema.type === 'array') {
				if (field.schema.items === 'version') {
					const versionOptions = await fetchProjectVersionsOptions(
						authValue,
						projectId as unknown as string,
					);
					props[field.key] = Property.StaticMultiSelectDropdown({
						displayName: field.name,
						required: field.required,
						options: {
							disabled: false,
							options: versionOptions,
						},
					});
				}
				if (field.schema.items === 'option') {
					props[field.key] = Property.StaticMultiSelectDropdown({
						displayName: field.name,
						required: field.required,
						options: {
							disabled: false,
							options: field.allowedValues
								? field.allowedValues.map((option) => ({
										label: option.value,
										value: option.value,
								  }))
								: [],
						},
					});
				}
				if(field.schema.items === 'string')
				{
					props[field.key] = Property.Array({
						displayName: field.name,
						required: field.required,
					});
				}
			} else {
				props[field.key] = createPropertyDefination(field);
			}
		}
		// Remove null props
		return Object.fromEntries(Object.entries(props).filter(([_, prop]) => prop !== null));
	},
});
