import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowListAssetsOutputSchema } from '../../../output-schemas';

export const listAssetsAction = createAction({
	auth: webflowAuth,
	name: 'webflow_list_assets',
	outputSchema: webflowListAssetsOutputSchema,
	displayName: 'List Assets',
	description: 'Lists the assets of a site.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists the images and files uploaded to a site, with each asset's id, file name, hosted URL, size and folder. Pages with limit and offset. Get the site id from List Sites.",
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
			path: `/v2/sites/${encodeURIComponent(context.propsValue.siteId)}/assets`,
			query: {
				limit: String(context.propsValue.limit ?? 100),
				offset: String(context.propsValue.offset ?? 0),
			},
		});
	},
});
