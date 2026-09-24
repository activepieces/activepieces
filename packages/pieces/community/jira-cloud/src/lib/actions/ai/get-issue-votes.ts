import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { issueVotesOutputSchema } from '../../output-schemas';
export const getIssueVotesAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_issue_votes',
	classification: 'READ',
	displayName: 'Get Issue Votes',
	description: 'Gets the vote count and voters of an issue.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Return the number of votes on an issue, whether the connected user has voted, and the voters when the user may see them. Voting must be enabled on the site. Read-only.',
		idempotent: true,
	},
	outputSchema: issueVotesOutputSchema,
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
	},
	async run({ auth, propsValue }) {
		return jiraApiCall<JiraRecord>({
			auth,
			method: HttpMethod.GET,
			resourceUri: `/issue/${encodeURIComponent(propsValue.issueIdOrKey.trim())}/votes`,
		});
	},
});
