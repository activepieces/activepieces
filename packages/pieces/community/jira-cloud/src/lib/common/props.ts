import {
	getIssueTypes,
	getProjects,
	getUsers,
	jiraApiCall,
	jiraPaginatedApiCall,
	sendJiraRequest,
} from '.';
import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { JiraAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { IssueFieldMetaData, IssueTypeMetadata } from './types';
import { isNil } from '@activepieces/shared';
import dayjs from 'dayjs';

export function getProjectIdDropdown(data?: DropdownParams) {
	return Property.Dropdown({
		displayName: data?.displayName ?? 'Project ID or Key',
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
					auth: auth as JiraAuth,
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

async function fetchGroupsOptions(auth: JiraAuth): Promise<DropdownOption<string>[]> {
	const response = await jiraApiCall<{
		groups: Array<{ groupId: string; name: string }>;
	}>({
		auth,
		method: HttpMethod.GET,
		resourceUri: `/groups/picker`,
	});

	const options: DropdownOption<string>[] = [];
	for (const group of response.groups) {
		options.push({
			value: group.groupId,
			label: group.name,
		});
	}

	return options;
}

async function fetchProjectVersionsOptions(
	auth: JiraAuth,
	projectId: string,
): Promise<DropdownOption<string>[]> {
	const response = await jiraApiCall<Array<{ id: string; name: string }>>({
		auth,
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

async function fetchUsersOptions(auth: JiraAuth): Promise<DropdownOption<string>[]> {
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
		refreshers: ['projectId'],
		required,
		options: async ({ auth, projectId }) => {
			if (!auth || !projectId) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your account first',
				};
			}

			const authValue = auth as JiraAuth;
			const response = await jiraPaginatedApiCall<IssueTypeMetadata, 'issueTypes'>({
				auth: authValue,
				resourceUri: `/issue/createmeta/${projectId}/issuetypes`,
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

export const issueLinkTypeIdProp = (displayName: string, required = true) =>
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

			const authValue = auth as JiraAuth;
			const response = await jiraApiCall<{ issueLinkTypes: Array<{ id: string; inward: string }> }>({
				auth: authValue,
				resourceUri: `/issueLinkType`,
				method: HttpMethod.GET,
			});

			const options: DropdownOption<string>[] = [];

			for (const linkType of response.issueLinkTypes) {
				options.push({
					value: linkType.id,
					label: linkType.inward,
				});
			}

			return {
				disabled: false,
				options,
			};
		},
	});

export const issueIdOrKeyProp = (displayName: string, required = true) =>
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
			const authValue = auth as JiraAuth;
			const response = await jiraPaginatedApiCall<{ id: string; key: string }, 'issues'>({
				auth: authValue,
				resourceUri: '/search',
				propertyName: 'issues',
				query: { fields: 'summary' },
				method: HttpMethod.GET,
			});

			const options: DropdownOption<string>[] = [];

			for (const issue of response) {
				options.push({
					value: issue.id,
					label: issue.key,
				});
			}

			return {
				disabled: false,
				options,
			};
		},
	});

export const issueStatusIdProp = (displayName: string, required = true) =>
	Property.Dropdown({
		displayName,
		refreshers: ['issueId'],
		required,
		options: async ({ auth, issueId }) => {
			if (!auth || !issueId) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your account first and select an issue.',
				};
			}

			const authValue = auth as JiraAuth;
			const response = await jiraApiCall<{ transitions: Array<{ id: string; name: string }> }>({
				auth: authValue,
				method: HttpMethod.GET,
				resourceUri: `/issue/${issueId}/transitions`,
			});

			const options: DropdownOption<string>[] = [];

			for (const status of response.transitions ?? []) {
				options.push({
					value: status.id,
					label: status.name,
				});
			}

			return {
				disabled: false,
				options,
			};
		},
	});

export async function createPropertyDefinition(
	auth: JiraAuth,
	field: IssueFieldMetaData,
	isRequired = false,
) {
	// Determine if the field is an array type
	const isArray = field.schema.type === 'array';
	const fieldType = isArray ? field.schema.items : field.schema.type;

	switch (fieldType) {
		case 'user': {
			const userOptions = await fetchUsersOptions(auth);
			return isArray
				? Property.StaticMultiSelectDropdown({
						displayName: field.name,
						required: isRequired,
						options: { disabled: false, options: userOptions },
				  })
				: Property.StaticDropdown({
						displayName: field.name,
						required: isRequired,
						options: { disabled: false, options: userOptions },
				  });
		}
		case 'group': {
			const groupOptions = await fetchGroupsOptions(auth);
			return isArray
				? Property.StaticMultiSelectDropdown({
						displayName: field.name,
						required: isRequired,
						options: { disabled: false, options: groupOptions },
				  })
				: Property.StaticDropdown({
						displayName: field.name,
						required: isRequired,
						options: { disabled: false, options: groupOptions },
				  });
		}
		case 'version': {
			const versionOptions = field.allowedValues
				? field.allowedValues.map((option) => ({
						label: option.name,
						value: option.id,
				  }))
				: [];
			return isArray
				? Property.StaticMultiSelectDropdown({
						displayName: field.name,
						required: isRequired,
						options: { disabled: false, options: versionOptions },
				  })
				: Property.StaticDropdown({
						displayName: field.name,
						required: isRequired,
						options: { disabled: false, options: versionOptions },
				  });
		}
		case 'priority': {
			const priorityOptions = field.allowedValues
				? field.allowedValues.map((option) => ({
						label: option.name,
						value: option.id,
				  }))
				: [];

			return Property.StaticDropdown({
				displayName: field.name,
				required: isRequired,
				options: { disabled: false, options: priorityOptions },
			});
		}
		case 'component': {
			const componentOptions = field.allowedValues
				? field.allowedValues.map((option) => ({
						label: option.name,
						value: option.id,
				  }))
				: [];

			return isArray
				? Property.StaticMultiSelectDropdown({
						displayName: field.name,
						required: isRequired,
						options: { disabled: false, options: componentOptions },
				  })
				: Property.StaticDropdown({
						displayName: field.name,
						required: isRequired,
						options: { disabled: false, options: componentOptions },
				  });
		}
		case 'option': {
			const options = field.allowedValues
				? field.allowedValues.map((option) => ({
						label: option.value,
						value: option.id,
				  }))
				: [];

			return isArray
				? Property.StaticMultiSelectDropdown({
						displayName: field.name,
						required: isRequired,
						options: { disabled: false, options: options },
				  })
				: Property.StaticDropdown({
						displayName: field.name,
						required: isRequired,
						options: { disabled: false, options: options },
				  });
		}
		case 'string': {
			return isArray
				? Property.Array({
						displayName: field.name,
						required: isRequired,
				  })
				: Property.LongText({
						displayName: field.name,
						required: isRequired,
				  });
		}
		case 'date':
			return Property.DateTime({
				displayName: field.name,
				description: 'Provide date in YYYY-MM-DD format.',
				required: isRequired,
			});

		case 'datetime':
			return Property.DateTime({
				displayName: field.name,
				required: isRequired,
			});

		case 'number':
			return Property.Number({
				displayName: field.name,
				required: isRequired,
			});

		case 'project':
			return Property.ShortText({
				displayName: field.name,
				required: isRequired,
				description: 'Provide project key.',
			});

		case 'issuelink':
			return Property.ShortText({
				displayName: field.name,
				required: isRequired,
				description: 'Provide issue key.',
			});
		default:
			return null;
	}
}

function parseArray(value: Array<string> | string): Array<string> {
	try {
		if (Array.isArray(value)) {
			return value;
		}

		const parsedValue = JSON.parse(value);
		if (Array.isArray(parsedValue)) {
			return parsedValue;
		}

		return [];
	} catch (e) {
		return [];
	}
}

// Function to format issue fields
// https://support.atlassian.com/cloud-automation/docs/advanced-field-editing-using-json/#Multi-user-picker-custom-field

export function formatIssueFields(
	fieldsMetadata: IssueFieldMetaData[],
	fieldsInput: Record<string, any>,
) {
	const fieldsOutput: Record<string, any> = {};

	for (const field of fieldsMetadata) {
		const key = field.key;
		const fieldInputValue = fieldsInput[key];

		// Skip if value is null, undefined, or empty string
		if (isNil(fieldInputValue) || fieldInputValue === '') continue;

		switch (field.schema.type) {
			case 'array': {
				const parsedArrayValue = parseArray(fieldInputValue);
				if (parsedArrayValue.length === 0) continue;

				fieldsOutput[key] =
					field.schema.items === 'string'
						? parsedArrayValue // Keep as flat array of strings
						: parsedArrayValue.map((item) =>
								field.schema.items === 'group' ? { groupId: item } : { id: item },
						  );
				break;
			}

			case 'user':
				fieldsOutput[key] = { accountId: fieldInputValue };
				break;
			case 'version':
			case 'option':
			case 'priority':
			case 'issuetype':
			case 'component':
				fieldsOutput[key] = { id: fieldInputValue };
				break;

			case 'issuelink':
				fieldsOutput[key] = { key: fieldInputValue };
				break;

			case 'group':
				fieldsOutput[key] = { groupId: fieldInputValue };
				break;

			case 'date':
				fieldsOutput[key] = dayjs(fieldInputValue).format('YYYY-MM-DD');
				break;

			case 'datetime':
				fieldsOutput[key] = dayjs(fieldInputValue).toISOString();
				break;

			case 'number':
				fieldsOutput[key] = Number(fieldInputValue);
				break;

			case 'project':
				fieldsOutput[key] = { key: fieldInputValue };
				break;

			case 'string': {
				const isCustomTextArea =
					field.schema.custom?.includes('textarea') || ['description', 'environment'].includes(key);

				if (isCustomTextArea) {
					fieldsOutput[key] = {
						type: 'doc',
						version: 1,
						content: [
							{
								type: 'paragraph',
								content: [{ text: fieldInputValue, type: 'text' }],
							},
						],
					};
				} else {
					fieldsOutput[key] = fieldInputValue;
				}
				break;
			}
		}
	}

	return fieldsOutput;
}

export function transformCustomFields(
	fieldsMetadata: IssueFieldMetaData[],
	fieldsInput: Record<string, any>,
): Record<string, any> {
	const result: Record<string, any> = {};

	const fieldsMapping = fieldsMetadata.reduce((acc, field) => {
		acc[field.key] = field.name;
		return acc;
	}, {} as Record<string, string>);

	for (const [key, value] of Object.entries(fieldsInput)) {
		result[key.startsWith('customfield_') ? fieldsMapping[key] ?? key : key] = value;
	}

	return result;
}
