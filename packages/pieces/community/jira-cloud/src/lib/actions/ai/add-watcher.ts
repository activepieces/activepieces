import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { jiraAiProps } from '../../common/ai-props';

import { watcherChangeOutputSchema } from '../../output-schemas';
export const addWatcherAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'add_watcher',
	classification: 'WRITE',
	displayName: 'Add Watcher',
	description: 'Adds a user to the watchers of an issue.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Add one user, by account ID, to the watcher list of an issue so they get its notifications. Adding someone other than yourself needs the Manage watcher list permission. Idempotent: adding an existing watcher changes nothing.',
		idempotent: true,
	},
	outputSchema: watcherChangeOutputSchema,
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
		accountId: jiraAiProps.accountId(),
	},
	async run({ auth, propsValue }) {
		const issueIdOrKey = propsValue.issueIdOrKey.trim();
		const accountId = propsValue.accountId.trim();
		await jiraApiCall({
			auth,
			method: HttpMethod.POST,
			resourceUri: `/issue/${encodeURIComponent(issueIdOrKey)}/watchers`,
			body: JSON.stringify(accountId),
		});
		return { success: true, issue: issueIdOrKey, account_id: accountId };
	},
});
