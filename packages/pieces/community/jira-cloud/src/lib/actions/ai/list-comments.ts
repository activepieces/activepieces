import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { commentPageOutputSchema } from '../../output-schemas';
export const listCommentsAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'list_comments',
	classification: 'SEARCH',
	displayName: 'List Comments',
	description: 'Lists the comments on an issue.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the comments on an issue, oldest or newest first, with each comment ID, author, timestamps and body as Atlassian Document Format plus rendered HTML. Use it to read a discussion or to find comment IDs for Update Comment and Delete Comment. Paginated with Start At. Read-only.',
		idempotent: true,
	},
	outputSchema: commentPageOutputSchema,
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
		orderBy: Property.StaticDropdown({
			displayName: 'Order',
			required: false,
			defaultValue: 'created',
			options: {
				options: [
					{ label: 'Oldest first', value: 'created' },
					{ label: 'Newest first', value: '-created' },
				],
			},
		}),
		startAt: jiraAiProps.startAt(),
		maxResults: jiraAiProps.maxResults({ max: 5000 }),
	},
	async run({ auth, propsValue }) {
		const response = await jiraApiCall<CommentPage>({
			auth,
			method: HttpMethod.GET,
			resourceUri: `/issue/${encodeURIComponent(propsValue.issueIdOrKey.trim())}/comment`,
			query: {
				orderBy: propsValue.orderBy,
				startAt: propsValue.startAt,
				maxResults: propsValue.maxResults,
				expand: 'renderedBody',
			},
		});
		return jiraAiHelpers.toPage({
			items: response.comments ?? [],
			startAt: response.startAt,
			maxResults: response.maxResults,
			total: response.total,
		});
	},
});

type CommentPage = {
	comments?: JiraRecord[];
	startAt?: number;
	maxResults?: number;
	total?: number;
};
