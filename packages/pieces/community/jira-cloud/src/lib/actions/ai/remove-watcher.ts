import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { jiraAiProps } from '../../common/ai-props';

import { watcherChangeOutputSchema } from '../../output-schemas';
export const removeWatcherAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'remove_watcher',
	classification: 'WRITE',
	displayName: 'Remove Watcher',
	description: 'Removes a user from the watchers of an issue.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Remove one user, by account ID, from the watcher list of an issue so they stop receiving its notifications. Removing another user needs the Manage watcher list permission. Not idempotent: a retry fails when the user is no longer watching.',
		idempotent: false,
	},
	outputSchema: watcherChangeOutputSchema,
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
		accountId: jiraAiProps.accountId({ description: 'Account ID of the watcher to remove. Find it with Get Issue Watchers.' }),
	},
	async run({ auth, propsValue }) {
		const issueIdOrKey = propsValue.issueIdOrKey.trim();
		const accountId = propsValue.accountId.trim();
		await jiraApiCall({
			auth,
			method: HttpMethod.DELETE,
			resourceUri: `/issue/${encodeURIComponent(issueIdOrKey)}/watchers`,
			query: { accountId },
		});
		return { success: true, issue: issueIdOrKey, account_id: accountId };
	},
});
