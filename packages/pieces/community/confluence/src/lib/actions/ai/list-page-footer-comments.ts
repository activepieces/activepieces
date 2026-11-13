import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListPageFooterCommentsOutputSchema } from '../../output-schemas';

export const listPageFooterCommentsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_page_footer_comments',
	outputSchema: confluenceListPageFooterCommentsOutputSchema,
	displayName: 'List Page Footer Comments',
	description: 'Lists the footer comments on a page.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the top-level footer comments on a Confluence page, with their bodies. Use List Footer Comment Replies for the replies under a comment. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
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
		const { pageId, bodyFormat, sort, limit, cursor } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'pages',
			contentId: pageId,
			relation: 'footer-comments',
			query: { 'body-format': bodyFormat ?? 'storage', sort, limit, cursor },
		});
	},
});
