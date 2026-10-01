import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord } from '../../common/ai-helpers';

import { currentUserOutputSchema } from '../../output-schemas';
export const getCurrentUserAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_current_user',
	classification: 'READ',
	displayName: 'Get Current User',
	description: 'Gets the user the connection is authenticated as.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Return the Jira user the connection is authenticated as, including account ID, display name, email (when visible), time zone and groups. Use it to get your own account ID for "assigned to me" requests or for Assign Issue to User. Read-only.',
		idempotent: true,
	},
	outputSchema: currentUserOutputSchema,
	props: {},
	async run({ auth }) {
		return jiraApiCall<JiraRecord>({
			auth,
			method: HttpMethod.GET,
			resourceUri: '/myself',
			query: { expand: 'groups' },
		});
	},
});
