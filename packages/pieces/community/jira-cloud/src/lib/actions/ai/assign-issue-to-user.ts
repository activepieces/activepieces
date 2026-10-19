import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { assignIssueToUserOutputSchema } from '../../output-schemas';
export const assignIssueToUserAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'assign_issue_to_user',
	classification: 'WRITE',
	displayName: 'Assign Issue to User',
	description: 'Assigns or unassigns an issue.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Assign an issue to a user by account ID, or unassign it by leaving the account ID empty. Resolve a name or email to an account ID with Find Users, or use Get Current User for yourself. The user must be assignable in the project. Idempotent: assigning the same user again changes nothing.',
		idempotent: true,
	},
	outputSchema: assignIssueToUserOutputSchema,
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
		accountId: Property.ShortText({
			displayName: 'Assignee Account ID',
			description: 'Account ID of the new assignee. Leave empty to unassign the issue.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const issueIdOrKey = propsValue.issueIdOrKey.trim();
		const accountId = jiraAiHelpers.isProvided(propsValue.accountId) ? propsValue.accountId.trim() : null;
		await jiraApiCall({
			auth,
			method: HttpMethod.PUT,
			resourceUri: `/issue/${encodeURIComponent(issueIdOrKey)}/assignee`,
			body: { accountId },
		});
		return { success: true, issue: issueIdOrKey, assignee_account_id: accountId };
	},
});
