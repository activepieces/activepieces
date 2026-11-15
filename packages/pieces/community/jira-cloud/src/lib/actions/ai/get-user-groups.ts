import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { userGroupsOutputSchema } from '../../output-schemas';
export const getUserGroupsAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_user_groups',
	classification: 'SEARCH',
	displayName: 'Get User Groups',
	description: 'Lists the groups a user belongs to.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the groups one user belongs to, with each group name and group ID. Use it to check group membership or to get group IDs for Send Issue Notification. Needs the Browse users and groups permission. Read-only.',
		idempotent: true,
	},
	outputSchema: userGroupsOutputSchema,
	props: {
		accountId: jiraAiProps.accountId(),
	},
	async run({ auth, propsValue }) {
		const groups = await jiraApiCall<JiraRecord[]>({
			auth,
			method: HttpMethod.GET,
			resourceUri: '/user/groups',
			query: { accountId: propsValue.accountId.trim() },
		});
		return jiraAiHelpers.toList({ items: groups });
	},
});
