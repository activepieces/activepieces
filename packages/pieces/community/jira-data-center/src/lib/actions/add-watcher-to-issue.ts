import { createAction } from '@activepieces/pieces-framework';
import { jiraDataCenterAuth } from '../../auth';
import { getUsersDropdown, issueIdOrKeyProp } from '../common/props';
import { isNil } from '@activepieces/shared';
import { jiraApiCall } from '../common';
import { HttpError, HttpMethod } from '@activepieces/pieces-common';

export const addWatcherToIssueAction = createAction({
	auth: jiraDataCenterAuth,
	name: 'add-watcher-to-issue',
	displayName: 'Add Watcher to Issue',
	description: 'Adds a new watcher to an issue.',
	audience: 'both',
	aiMetadata: {
		description:
			'Adds a user as a watcher on a Jira Data Center/Server issue so they receive notifications about it. Identify the issue by ID or key and the watcher by Jira username. Idempotent — adding an already-watching user does not create a duplicate.',
		idempotent: true,
	},
	props: {
		issueId: issueIdOrKeyProp('Issue ID or Key', true),
		userId: getUsersDropdown({
			displayName: 'User',
			refreshers: [],
			required: true,
		}),
	},
	async run(context) {
		const { issueId, userId } = context.propsValue;
		if (isNil(issueId)) {
			throw new Error('Issue ID is required');
		}
		if (isNil(userId)) {
			throw new Error('User ID is required');
		}

		try {
			await jiraApiCall({
				auth: context.auth,
				method: HttpMethod.POST,
				resourceUri: `/issue/${issueId}/watchers`,
				body: `"${userId}"`,
			});

			return { success: true };
		} catch (e) {
			return { success: false, error: (e as HttpError).message };
		}
	},
});
