import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListPageAncestorsOutputSchema } from '../../output-schemas';

export const listPageAncestorsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_page_ancestors',
	outputSchema: confluenceListPageAncestorsOutputSchema,
	displayName: 'List Page Ancestors',
	description: 'Lists the ancestors of a page, from the top of the tree down.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the ancestors (parent, grandparent and up) of a Confluence page, ordered from the top of the tree down to the direct parent. Use it to show where a page sits in its space.',
		idempotent: true,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
		limit: confluenceAiProps.limit({ required: false }),
	},
	async run(context) {
		const { pageId, limit } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'pages',
			contentId: pageId,
			relation: 'ancestors',
			query: { limit },
		});
	},
});
