import { createAction } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { getUsersDropdown, issueIdOrKeyProp } from '../common/props';
import { isNil } from '@activepieces/shared';
import { jiraApiCall } from '../common';
import { HttpError, HttpMethod } from '@activepieces/pieces-common';

export const addWatcherToIssueAction = createAction({
	auth: jiraCloudAuth,
	name: 'add-watcher-to-issue',
	displayName: 'Add Watcher to Issue',
	description: 'Adds a new watcher to an issue.',
	audience: 'both',
	aiMetadata: {
		description:
			'Subscribe a specific user as a watcher on a Jira issue (by issue ID/key and user account) so they get notifications about its updates. Use to loop someone in without assigning or commenting. Effectively idempotent: adding a user who already watches the issue leaves it unchanged.',
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
			const response = await jiraApiCall({
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
