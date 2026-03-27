import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { JiraDataCenterAuth, jiraDataCenterAuth } from '../../auth';
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

function normalizeFields(fields: any[]): IssueFieldMetaData[] {
	return fields.map((field) => ({
		...field,
		key: field.key ?? field.fieldId,
		fieldId: field.fieldId ?? field.key,
	}));
}

async function getFields(auth: JiraDataCenterAuth, projectId: string, issueTypeId: string): Promise<IssueFieldMetaData[]> {
	const fields = await jiraPaginatedApiCall<IssueFieldMetaData, 'values'>({
		auth,
		method: HttpMethod.GET,
		resourceUri: `/issue/createmeta/${projectId}/issuetypes/${issueTypeId}`,
		propertyName: 'values',
	});

	if (!fields || !Array.isArray(fields)) {
		return [];
	}

	return normalizeFields(fields);
}

export const createIssueAction = createAction({
	name: 'create_issue',
	displayName: 'Create Issue',
	description: 'Creates a new issue in a project.',
	auth: jiraDataCenterAuth,
	props: {
		projectId: getProjectIdDropdown(),
		issueTypeId: issueTypeIdProp('Issue Type'),
		issueFields: Property.DynamicProperties({
			auth: jiraDataCenterAuth,
			displayName: 'Fields',
			required: true,
			refreshers: ['projectId', 'issueTypeId'],
			props: async ({ auth, projectId, issueTypeId }) => {
				if (!auth || !issueTypeId || !projectId) {
					return {};
				}

				const props: DynamicPropsValue = {};

				const authValue = auth as JiraDataCenterAuth;
				const projectIdValue = projectId as unknown as string;
				const issueTypeIdValue = issueTypeId as unknown as string;

				const fields = await getFields(authValue, projectIdValue, issueTypeIdValue);

				for (const field of fields) {
					// skip invalid custom fields
					if (field.schema.custom) {
						const customFieldType = field.schema.custom.split(':')[1];
						if (!VALID_CUSTOM_FIELD_TYPES.includes(customFieldType)) {
							continue;
						}
					}
					if (['project', 'issuetype', 'reporter'].includes(field.key)) {
						continue;
					}

					props[field.key] = await createPropertyDefinition(authValue, field, field.required, projectIdValue);
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

		const rawFields = await jiraPaginatedApiCall<IssueFieldMetaData, 'values'>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/issue/createmeta/${projectId}/issuetypes/${issueTypeId}`,
			propertyName: 'values',
		});
		const issueTypeFields = normalizeFields(rawFields);

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
						key: projectId,
					},
					...formattedFields,
				},
			},
		});

		const issue = await jiraApiCall<{
			expand: string;
			id: string;
			key: string;
			fields: Record<string, unknown>;
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
