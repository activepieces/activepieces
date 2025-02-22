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
import { IssueFieldMetaData, IssueTypeMetadata, VALID_CUSTOM_FIELD_TYPES } from './types';
import { isNil } from '@activepieces/shared';
import dayjs from 'dayjs';

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

async function fetchGroupsOptions(
	auth: PiecePropValueSchema<typeof jiraCloudAuth>,
): Promise<DropdownOption<string>[]> {
	const response = await jiraApiCall<{
		groups: Array<{ groupId: string; name: string }>;
	}>({
		domain: auth.instanceUrl,
		username: auth.email,
		password: auth.apiToken,
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
		refreshers: ['projectId'],
		required,
		options: async ({ auth,projectId }) => {
			if (!auth || !projectId) {
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
			// skip invalid custom fields
			if (field.schema.custom) {
				const customFieldType = field.schema.custom.split(':')[1];
				if (!VALID_CUSTOM_FIELD_TYPES.includes(customFieldType)) {
					continue;
				}
			}
			if (['project', 'issuetype'].includes(field.key)) {
				continue;
			}

			// Determine if the field is an array type
			const isArray = field.schema.type === 'array';
			const fieldType = isArray ? field.schema.items : field.schema.type;

			switch (fieldType) {
				case 'user': {
					const userOptions = await fetchUsersOptions(authValue, projectId as unknown as string);
					props[field.key] = isArray
						? Property.StaticMultiSelectDropdown({
								displayName: field.name,
								required: field.required,
								options: { disabled: false, options: userOptions },
						  })
						: Property.StaticDropdown({
								displayName: field.name,
								required: field.required,
								options: { disabled: false, options: userOptions },
						  });
					break;
				}
				case 'group': {
					const groupOptions = await fetchGroupsOptions(authValue);
					props[field.key] = isArray
						? Property.StaticMultiSelectDropdown({
								displayName: field.name,
								required: field.required,
								options: { disabled: false, options: groupOptions },
						  })
						: Property.StaticDropdown({
								displayName: field.name,
								required: field.required,
								options: { disabled: false, options: groupOptions },
						  });
					break;
				}
				case 'version': {
					const versionOptions = await fetchProjectVersionsOptions(
						authValue,
						projectId as unknown as string,
					);
					props[field.key] = isArray
						? Property.StaticMultiSelectDropdown({
								displayName: field.name,
								required: field.required,
								options: { disabled: false, options: versionOptions },
						  })
						: Property.StaticDropdown({
								displayName: field.name,
								required: field.required,
								options: { disabled: false, options: versionOptions },
						  });
					break;
				}
				case 'priority': {
					const options = field.allowedValues
						? field.allowedValues.map((option) => ({
								label: option.name,
								value: option.id,
						  }))
						: [];

					props[field.key] = Property.StaticDropdown({
						displayName: field.name,
						required: field.required,
						options: { disabled: false, options: options },
					});
					break;
				}
				case 'option': {
					const options = field.allowedValues
						? field.allowedValues.map((option) => ({
								label: option.value,
								value: option.id,
						  }))
						: [];

					props[field.key] = isArray
						? Property.StaticMultiSelectDropdown({
								displayName: field.name,
								required: field.required,
								options: { disabled: false, options: options },
						  })
						: Property.StaticDropdown({
								displayName: field.name,
								required: field.required,
								options: { disabled: false, options: options },
						  });
					break;
				}
				case 'string': {
					props[field.key] = isArray
						? Property.Array({
								displayName: field.name,
								required: field.required,
						  })
						: Property.LongText({
								displayName: field.name,
								required: field.required,
						  });
					break;
				}
				case 'date':
					props[field.key] = Property.DateTime({
						displayName: field.name,
						description: 'Provide date in YYYY-MM-DD format.',
						required: field.required,
					});
					break;
				case 'datetime':
					props[field.key] = Property.DateTime({
						displayName: field.name,
						required: field.required,
					});
					break;
				case 'number':
					props[field.key] = Property.Number({
						displayName: field.name,
						required: field.required,
					});
					break;
				case 'project':
					props[field.key] = Property.ShortText({
						displayName: field.name,
						required: field.required,
						description: 'Provide project key.',
					});
					break;
				case 'issuelink':
					props[field.key] = Property.ShortText({
						displayName: field.name,
						required: field.required,
						description: 'Provide issue ID.',
					});
					break;
			}
		}
		// Remove null props
		return Object.fromEntries(Object.entries(props).filter(([_, prop]) => prop !== null));
	},
});

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
			case 'version':
			case 'option':
			case 'issuelink':
			case 'priority':
				fieldsOutput[key] = { id: fieldInputValue };
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
