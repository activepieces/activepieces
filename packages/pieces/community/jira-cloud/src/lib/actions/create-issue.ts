import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { JiraAuth, jiraCloudAuth } from '../../auth';
import {
	getProjectIdDropdown,
	formatIssueFields,
	issueTypeIdProp,
	createPropertyDefinition,
	transformCustomFields,
} from '../common/props';
import { jiraApiCall, jiraPaginatedApiCall } from '../common';
import { IssueFieldMetaData, VALID_CUSTOM_FIELD_TYPES } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

export const createIssueAction = createAction({
	name: 'create_issue',
	displayName: 'Create Issue',
	description: 'Creates a new issue in a project.',
	auth: jiraCloudAuth,
	props: {
		projectId: getProjectIdDropdown(),
		issueTypeId: issueTypeIdProp('Issue Type'),
		issueFields: Property.DynamicProperties({
			displayName: 'Fields',
			required: true,
			refreshers: ['projectId', 'issueTypeId'],
			props: async ({ auth, projectId, issueTypeId }) => {
				if (!auth || !issueTypeId || !projectId) {
					return {};
				}

				const props: DynamicPropsValue = {};

				const authValue = auth as JiraAuth;
				const fields = await jiraPaginatedApiCall<IssueFieldMetaData, 'fields'>({
					auth: authValue,
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

					props[field.key] = await createPropertyDefinition(authValue, field, field.required);
				}
				// Remove null props
				return Object.fromEntries(Object.entries(props).filter(([_, prop]) => prop !== null));
			},
		}),
	},
	async run(context) {
		const { projectId, issueTypeId } = context.propsValue;
		const inputIssueFields = context.propsValue.issueFields ?? {};

		if (isNil(projectId) || isNil(issueTypeId)) {
			throw new Error('Project ID and Issue Type ID are required');
		}

		const issueTypeFields = await jiraPaginatedApiCall<IssueFieldMetaData, 'fields'>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/issue/createmeta/${projectId}/issuetypes/${issueTypeId}`,
			propertyName: 'fields',
		});

		const formattedFields = formatIssueFields(issueTypeFields, inputIssueFields);

		const response = await jiraApiCall<{ id: string; key: string }>({
			auth: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/issue`,
			body: {
				fields: {
					issuetype: {
						id: issueTypeId,
					},
					project: {
						id: projectId,
					},
					...formattedFields,
				},
			},
		});

		const issue = await jiraApiCall<{
			expand: string;
			id: string;
			key: string;
			fields: Record<string, any>;
		}>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/issue/${response.id}`,
		});

		const updatedIssueProperties = transformCustomFields(issueTypeFields, issue.fields);

		return {
			...issue,
			fields: updatedIssueProperties,
		};
	},
});
