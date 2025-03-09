import { DynamicPropsValue, Property, createAction } from '@activepieces/pieces-framework';
import { JiraAuth, jiraCloudAuth } from '../../auth';
import {
	createPropertyDefinition,
	formatIssueFields,
	issueIdOrKeyProp,
	issueStatusIdProp,
	transformCustomFields,
} from '../common/props';
import { jiraApiCall } from '../common';
import { IssueFieldMetaData, VALID_CUSTOM_FIELD_TYPES } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

export const updateIssueAction = createAction({
	name: 'update_issue',
	displayName: 'Update Issue',
	description: 'Updates an existing issue.',
	auth: jiraCloudAuth,
	props: {
		issueId: issueIdOrKeyProp('Issue ID or Key', true),
		statusId: issueStatusIdProp('Status', false),
		issueFields: Property.DynamicProperties({
			displayName: 'Fields',
			required: true,
			refreshers: ['issueId'],
			props: async ({ auth, issueId }) => {
				if (!auth || !issueId) {
					return {};
				}

				const props: DynamicPropsValue = {};

				const authValue = auth as JiraAuth;
				const response = await jiraApiCall<{ fields: { [x: string]: IssueFieldMetaData } }>({
					auth: authValue,
					method: HttpMethod.GET,
					resourceUri: `/issue/${issueId}/editmeta`,
				});

				if (!response.fields) return {};

				for (const key in response.fields) {
					const field = response.fields[key];

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
	},
	async run(context) {
		const { issueId, statusId } = context.propsValue;
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

		const formattedFields = formatIssueFields(flattenedFields, inputIssueFields);

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
