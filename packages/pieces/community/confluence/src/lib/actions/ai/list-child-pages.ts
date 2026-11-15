import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListChildPagesOutputSchema } from '../../output-schemas';

export const listChildPagesAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_child_pages',
	outputSchema: confluenceListChildPagesOutputSchema,
	displayName: 'List Child Content',
	description: 'Lists the direct children of a page.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the direct children of a Confluence page: child pages, folders, whiteboards and other content, each with its type. Use List Page Descendants for the whole sub-tree. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { pageId, limit, cursor } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'pages',
			contentId: pageId,
			relation: 'direct-children',
			query: { limit, cursor },
		});
	},
});
