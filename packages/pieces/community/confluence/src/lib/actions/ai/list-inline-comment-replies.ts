import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListInlineCommentRepliesOutputSchema } from '../../output-schemas';

export const listInlineCommentRepliesAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_inline_comment_replies',
	outputSchema: confluenceListInlineCommentRepliesOutputSchema,
	displayName: 'List Inline Comment Replies',
	description: 'Lists the replies to a inline comment.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the direct replies to a Confluence inline comment, with their bodies. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		commentId: confluenceAiProps.commentId({ required: true }),
		bodyFormat: confluenceAiProps.readBodyFormat({ required: false }),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Newest first', value: '-created-date' },
					{ label: 'Oldest first', value: 'created-date' },
					{ label: 'Recently modified first', value: '-modified-date' },
				],
			},
		}),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { commentId, bodyFormat, sort, limit, cursor } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'inline-comments',
			contentId: commentId,
			relation: 'children',
			query: { 'body-format': bodyFormat ?? 'storage', sort, limit, cursor },
		});
	},
});
