import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { commentOutputSchema } from '../../output-schemas';
export const updateCommentAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'update_comment',
	classification: 'WRITE',
	displayName: 'Update Comment',
	description: 'Replaces the text of a comment.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Replace the text of an existing comment on an issue with new markdown text; the comment keeps its author and visibility. Comment IDs come from List Comments, and only the author or a user with edit-all-comments permission may edit. Idempotent: writing the same text again changes nothing.',
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
		comment: jiraAiProps.markdownText({ displayName: 'Comment', description: 'The new comment text.' }),
		notifyUsers: Property.Checkbox({
			displayName: 'Notify Watchers',
			required: false,
			defaultValue: true,
		}),
	},
	async run({ auth, propsValue }) {
		return jiraApiCall<JiraRecord>({
			auth,
			method: HttpMethod.PUT,
			resourceUri: `/issue/${encodeURIComponent(propsValue.issueIdOrKey.trim())}/comment/${encodeURIComponent(propsValue.commentId.trim())}`,
			query: { notifyUsers: String(propsValue.notifyUsers !== false) },
			body: { body: jiraAiHelpers.markdownToAdf({ markdown: propsValue.comment }) },
		});
	},
});
