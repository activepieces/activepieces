import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListBlogPostOperationsOutputSchema } from '../../output-schemas';

export const listPageOperationsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_page_operations',
	outputSchema: confluenceListBlogPostOperationsOutputSchema,
	displayName: 'List Page Permitted Operations',
	description: 'Lists what the connected user may do on a page.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Lists the operations (read, update, delete and so on) the connected user is permitted to perform on a Confluence page. Use it to check access before trying a write.',
		idempotent: true,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
	},
	async run(context) {
		return await confluenceApi.listContentOperations({
			auth: context.auth,
			contentType: 'pages',
			contentId: context.propsValue.pageId,
		});
	},
});
