import { createAction } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import {
	getProjectIdDropdown,
	formatIssueFields,
	issueFieldsProp,
	issueTypeIdProp,
} from '../common/props';
import { jiraApiCall, jiraPaginatedApiCall } from '../common';
import { IssueFieldMetaData } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

export const createIssue = createAction({
	name: 'create_issue',
	displayName: 'Create Issue',
	description: 'Creates a new issue in a project.',
	auth: jiraCloudAuth,
	props: {
		projectId: getProjectIdDropdown(),
		issueTypeId: issueTypeIdProp('Issue Type'),
		issueFields: issueFieldsProp,
	},
	async run(context) {
		const { projectId, issueTypeId } = context.propsValue;
		const inputIssueFields = context.propsValue.issueFields ?? {};

		if (isNil(projectId) || isNil(issueTypeId)) {
			throw new Error('Project ID and Issue Type ID are required');
		}

		const issueTypeFields = await jiraPaginatedApiCall<IssueFieldMetaData, 'fields'>({
			domain: context.auth.instanceUrl,
			username: context.auth.email,
			password: context.auth.apiToken,
			method: HttpMethod.GET,
			resourceUri: `/issue/createmeta/${projectId}/issuetypes/${issueTypeId}`,
			propertyName: 'fields',
		});

		const formattedFields = formatIssueFields(issueTypeFields, inputIssueFields);

		const response = await jiraApiCall({
			domain: context.auth.instanceUrl,
			username: context.auth.email,
			password: context.auth.apiToken,
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

		return response;
	},
});
