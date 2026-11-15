import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';

import { myPermissionsOutputSchema } from '../../output-schemas';
export const getMyPermissionsAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_my_permissions',
	classification: 'READ',
	displayName: 'Get My Permissions',
	description: 'Checks which permissions the user has, globally or in a project or issue.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Check whether the connected user holds specific permissions, globally or within one project or issue, returning havePermission for each key. Use it before a write to explain a likely permission failure; to list every project where a permission holds use Get Permitted Projects. Read-only.',
		idempotent: true,
	},
	outputSchema: myPermissionsOutputSchema,
	props: {
		permissions: Property.Array({
			displayName: 'Permission Keys',
			description:
				'Permission keys to check, e.g. BROWSE_PROJECTS, CREATE_ISSUES, EDIT_ISSUES, TRANSITION_ISSUES, ASSIGN_ISSUES, ADD_COMMENTS, DELETE_ISSUES, WORK_ON_ISSUES, ADMINISTER_PROJECTS.',
			required: true,
		}),
		projectKey: Property.ShortText({
			displayName: 'Project Key',
			description: 'Check the permissions within this project.',
			required: false,
		}),
		issueKey: Property.ShortText({
			displayName: 'Issue Key',
			description: 'Check the permissions on this issue.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const permissions = jiraAiHelpers.toStringList({ value: propsValue.permissions });
		if (permissions.length === 0) {
			throw new Error('Provide at least one permission key.');
		}
		const response = await jiraApiCall<{ permissions?: Record<string, JiraRecord> }>({
			auth,
			method: HttpMethod.GET,
			resourceUri: '/mypermissions',
			query: { permissions, projectKey: propsValue.projectKey, issueKey: propsValue.issueKey },
		});
		return jiraAiHelpers.toList({ items: Object.values(response.permissions ?? {}) });
	},
});
