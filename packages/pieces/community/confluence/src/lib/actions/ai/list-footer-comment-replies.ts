import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListFooterCommentRepliesOutputSchema } from '../../output-schemas';

export const listFooterCommentRepliesAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_footer_comment_replies',
	outputSchema: confluenceListFooterCommentRepliesOutputSchema,
	displayName: 'List Footer Comment Replies',
	description: 'Lists the replies to a footer comment.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the direct replies to a Confluence footer comment, with their bodies. Pass nextCursor back as Cursor for the next page.',
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
			contentType: 'footer-comments',
			contentId: commentId,
			relation: 'children',
			query: { 'body-format': bodyFormat ?? 'storage', sort, limit, cursor },
		});
	},
});
