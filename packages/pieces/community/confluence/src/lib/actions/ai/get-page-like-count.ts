import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceGetBlogPostLikeCountOutputSchema } from '../../output-schemas';

export const getPageLikeCountAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_get_page_like_count',
	outputSchema: confluenceGetBlogPostLikeCountOutputSchema,
	displayName: 'Get Page Like Count',
	description: 'Gets how many likes a page has.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Returns the number of likes on a Confluence page.',
		idempotent: true,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
	},
	async run(context) {
		return await confluenceApi.getContentLikeCount({
			auth: context.auth,
			contentType: 'pages',
			contentId: context.propsValue.pageId,
		});
	},
});
