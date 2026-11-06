import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowListPagesOutputSchema } from '../../../output-schemas';

export const listPagesAction = createAction({
	auth: webflowAuth,
	name: 'webflow_list_pages',
	outputSchema: webflowListPagesOutputSchema,
	displayName: 'List Pages',
	description: 'Lists the pages of a site.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists the pages of a site with each page's id, title, slug, parent folder and draft or archived state. Pages with limit and offset. Get the site id from List Sites.",
		idempotent: true,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		limit: webflowAiProps.limit({ required: false }),
		offset: webflowAiProps.offset({ required: false }),
	},
	async run(context) {
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/sites/${encodeURIComponent(context.propsValue.siteId)}/pages`,
			query: {
				limit: String(context.propsValue.limit ?? 100),
				offset: String(context.propsValue.offset ?? 0),
			},
		});
	},
});
