import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListPageInlineCommentsOutputSchema } from '../../output-schemas';

export const listPageInlineCommentsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_page_inline_comments',
	outputSchema: confluenceListPageInlineCommentsOutputSchema,
	displayName: 'List Page Inline Comments',
	description: 'Lists the inline comments on a page.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the top-level inline comments on a Confluence page, with their bodies. Use List Inline Comment Replies for the replies under a comment. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
		resolutionStatus: Property.StaticDropdown({
			displayName: 'Resolution Status',
			description: 'Only comments with this resolution status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Open', value: 'open' },
					{ label: 'Resolved', value: 'resolved' },
					{ label: 'Reopened', value: 'reopened' },
					{ label: 'Dangling (highlighted text removed)', value: 'dangling' },
				],
			},
		}),
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
		const { pageId, bodyFormat, sort, limit, cursor, resolutionStatus } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'pages',
			contentId: pageId,
			relation: 'inline-comments',
			query: {
				'body-format': bodyFormat ?? 'storage',
				sort,
				'resolution-status': resolutionStatus,
				limit,
				cursor,
			},
		});
	},
});
