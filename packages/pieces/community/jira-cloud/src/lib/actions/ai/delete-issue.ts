import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { jiraAiProps } from '../../common/ai-props';

import { deleteIssueOutputSchema } from '../../output-schemas';
export const deleteIssueAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'delete_issue',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Issue',
	description: 'Permanently deletes an issue.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently delete a Jira issue and, if requested, its subtasks. This cannot be undone, so confirm with the user first; to close an issue instead, use Transition Issue Status. Fails when the issue has subtasks and Delete Subtasks is off. Not idempotent: a retry returns not found.',
		idempotent: false,
	},
	outputSchema: deleteIssueOutputSchema,
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
		deleteSubtasks: Property.Checkbox({
			displayName: 'Delete Subtasks',
			description: 'Also delete the subtasks of the issue. Required when the issue has subtasks.',
			required: false,
			defaultValue: false,
		}),
	},
	async run({ auth, propsValue }) {
		const issueIdOrKey = propsValue.issueIdOrKey.trim();
		await jiraApiCall({
			auth,
			method: HttpMethod.DELETE,
			resourceUri: `/issue/${encodeURIComponent(issueIdOrKey)}`,
			query: { deleteSubtasks: String(propsValue.deleteSubtasks === true) },
		});
		return { success: true, issue: issueIdOrKey, deleted: true };
	},
});
