import { DynamicPropsValue, Property, createAction } from '@activepieces/pieces-framework';
import { JiraAuth, jiraCloudAuth } from '../../auth';
import {
	createPropertyDefinition,
	formatIssueFields,
	issueIdOrKeyProp,
	issueStatusIdProp,
	transformCustomFields,
	isFieldAdfCompatible,
} from '../common/props';
import { jiraApiCall } from '../common';
import { IssueFieldMetaData, VALID_CUSTOM_FIELD_TYPES } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

async function getFields(auth: JiraAuth, issueId: string): Promise<IssueFieldMetaData[]> {
	const response = await jiraApiCall<{ fields: { [x: string]: IssueFieldMetaData } }>({
		auth: auth,
		method: HttpMethod.GET,
		resourceUri: `/issue/${issueId}/editmeta`,
	});

	const fields: IssueFieldMetaData[] = [];
	for (const key in response.fields) {
		fields.push(response.fields[key]);
	}

	if (!fields || !Array.isArray(fields)) {
		return [];
	}

	return fields;
}

export const updateIssueAction = createAction({
	name: 'update_issue',
	displayName: 'Update Issue',
	description: 'Updates an existing issue.',
	auth: jiraCloudAuth,
	props: {
		issueId: issueIdOrKeyProp('Issue ID or Key', true),
		statusId: issueStatusIdProp('Status', false),
		issueFields: Property.DynamicProperties({
			auth: jiraCloudAuth,
			displayName: 'Fields',
			required: true,
			refreshers: ['issueId'],
			props: async ({ auth, issueId }) => {
				if (!auth || !issueId) {
					return {};
				}

				const props: DynamicPropsValue = {};

				const authValue = auth as JiraAuth;
				const issueIdValue = issueId as unknown as string;

				const fields = await getFields(authValue, issueIdValue);

				for (const field of fields) {
					// skip invalid custom fields
					if (field.schema.custom) {
						const customFieldType = field.schema.custom.split(':')[1];
						if (!VALID_CUSTOM_FIELD_TYPES.includes(customFieldType)) {
							continue;
						}
					}

					if (field.key === 'issuetype') {
						props[field.key] = Property.StaticDropdown({
							displayName: field.name,
							required: false,
							options: {
								disabled: false,
								options: field.allowedValues
									? field.allowedValues.map((option) => ({
											label: option.name,
											value: option.id,
									  }))
									: [],
							},
						});
					} else {
						props[field.key] = await createPropertyDefinition(authValue, field, false);
					}
				}
				// Remove null props
				return Object.fromEntries(Object.entries(props).filter(([_, prop]) => prop !== null));
			},
		}),
		adfFields: Property.MultiSelectDropdown({
			auth: jiraCloudAuth,
			displayName: 'Fields in JSON Atlassian Document Format',
			description: 'https://developer.atlassian.com/cloud/jira/platform/apis/document/structure',
			required: false,
			refreshers: ['issueId'],
			options: async ({ auth, issueId }) => {
				if (!auth || !issueId) {
					return {
						disabled: true,
						options: [],
					};
				}

				const authValue = auth as JiraAuth;
				const issueIdValue = issueId as unknown as string;

				const fields = await getFields(authValue, issueIdValue);
				const adfCompatibleFields = fields.filter(isFieldAdfCompatible);
				const fieldOptions = adfCompatibleFields.map(field => ({
					label: field.name,
					value: field.key,
				}))
	
				return {
					disabled: false,
					options: fieldOptions,
				};
			},
		}),
	},
	async run(context) {
		const { issueId, statusId, adfFields } = context.propsValue;
		const inputIssueFields = context.propsValue.issueFields ?? {};

		if (isNil(issueId)) {
			throw new Error('Issue ID is required');
		}

		if (!isNil(statusId) && statusId !== '') {
			await jiraApiCall({
				auth: context.auth,
				method: HttpMethod.POST,
				resourceUri: `/issue/${issueId}/transitions`,
				body: {
					transition: {
						id: statusId,
					},
				},
			});
		}

		const issueTypeFields = await jiraApiCall<{ fields: { [x: string]: IssueFieldMetaData } }>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/issue/${issueId}/editmeta`,
		});

		const flattenedFields = Object.values(issueTypeFields.fields);

		const formattedAdfFields = adfFields || [];
		const formattedFields = formatIssueFields(flattenedFields, inputIssueFields, formattedAdfFields);

		const response = await jiraApiCall({
			auth: context.auth,
			method: HttpMethod.PUT,
			resourceUri: `/issue/${issueId}`,
			body: {
				fields: formattedFields,
			},
			query: { returnIssue: 'true' },
		});

		const issue = await jiraApiCall<{
			expand: string;
			id: string;
			key: string;
			fields: Record<string, any>;
		}>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/issue/${issueId}`,
		});

		const updatedIssueProperties = transformCustomFields(flattenedFields, issue.fields);

		return {
			...issue,
			fields: updatedIssueProperties,
		};
	},
});
