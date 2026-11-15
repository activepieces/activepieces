import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { commentOutputSchema } from '../../output-schemas';
export const addCommentAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'add_comment',
	classification: 'WRITE',
	displayName: 'Add Comment',
	description: 'Adds a comment to an issue.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Post a new comment on an issue. The text is written in markdown and converted to Jira rich text automatically, so no separate conversion step is needed. Not idempotent: each call adds another comment, so check List Comments before retrying.',
		idempotent: false,
	},
	outputSchema: commentOutputSchema,
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
		comment: jiraAiProps.markdownText({ displayName: 'Comment', description: 'The comment text.' }),
	},
	async run({ auth, propsValue }) {
		return jiraApiCall<JiraRecord>({
			auth,
			method: HttpMethod.POST,
			resourceUri: `/issue/${encodeURIComponent(propsValue.issueIdOrKey.trim())}/comment`,
			body: { body: jiraAiHelpers.markdownToAdf({ markdown: propsValue.comment }) },
		});
	},
});
