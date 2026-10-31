import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowListCustomCodeBlocksOutputSchema } from '../../../output-schemas';

export const listCustomCodeBlocksAction = createAction({
	auth: webflowAuth,
	name: 'webflow_list_custom_code_blocks',
	outputSchema: webflowListCustomCodeBlocksOutputSchema,
	displayName: 'List Custom Code Blocks',
	description: 'Lists the scripts applied to a site and its pages.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every custom code block on a site, one per site or page that has scripts applied, each with its page id (for page blocks) and scripts. Pages with limit and offset. Get the site id from List Sites.',
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
			path: `/v2/sites/${encodeURIComponent(context.propsValue.siteId)}/custom_code/blocks`,
			query: {
				limit: String(context.propsValue.limit ?? 100),
				offset: String(context.propsValue.offset ?? 0),
			},
		});
	},
});
