import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { commentOutputSchema } from '../../output-schemas';
export const getCommentAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_comment',
	classification: 'READ',
	displayName: 'Get Comment',
	description: 'Gets a single comment on an issue.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Fetch one comment on an issue by its comment ID, including author, timestamps, visibility and the body as Atlassian Document Format plus rendered HTML. Use List Comments to discover comment IDs. Read-only.',
		idempotent: true,
	},
	outputSchema: commentOutputSchema,
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
		commentId: Property.ShortText({
			displayName: 'Comment ID',
			description: 'The numeric comment ID. Find it with List Comments.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return jiraApiCall<JiraRecord>({
			auth,
			method: HttpMethod.GET,
			resourceUri: `/issue/${encodeURIComponent(propsValue.issueIdOrKey.trim())}/comment/${encodeURIComponent(propsValue.commentId.trim())}`,
			query: { expand: 'renderedBody' },
		});
	},
});
