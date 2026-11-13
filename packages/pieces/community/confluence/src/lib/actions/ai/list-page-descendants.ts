import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListPageDescendantsOutputSchema } from '../../output-schemas';

export const listPageDescendantsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_page_descendants',
	outputSchema: confluenceListPageDescendantsOutputSchema,
	displayName: 'List Page Descendants',
	description: 'Lists all content below a page, up to a depth.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every piece of content below a Confluence page (children, grandchildren and so on) up to the given depth, each with its type, depth and parent ID. Use List Child Content for direct children only. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
		depth: Property.Number({
			displayName: 'Depth',
			description: 'How many levels below the page to include (1-5). Defaults to 5.',
			required: false,
		}),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { pageId, depth, limit, cursor } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'pages',
			contentId: pageId,
			relation: 'descendants',
			query: { depth, limit, cursor },
		});
	},
});
