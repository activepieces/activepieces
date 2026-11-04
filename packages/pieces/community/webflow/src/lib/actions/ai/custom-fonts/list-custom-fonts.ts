import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowListCustomFontsOutputSchema } from '../../../output-schemas';

export const listCustomFontsAction = createAction({
	auth: webflowAuth,
	name: 'webflow_list_custom_fonts',
	outputSchema: webflowListCustomFontsOutputSchema,
	displayName: 'List Custom Fonts',
	description: 'Lists the custom fonts uploaded to a site.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists the custom fonts uploaded to a site, with each font's id, family, weight, style and hosted URL. Pages with limit and offset. Get the site id from List Sites.",
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
			path: `/v2/sites/${encodeURIComponent(context.propsValue.siteId)}/custom_fonts`,
			query: {
				limit: String(context.propsValue.limit ?? 100),
				offset: String(context.propsValue.offset ?? 0),
			},
		});
	},
});
