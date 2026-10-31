import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowGetPageOutputSchema } from '../../../output-schemas';

export const getPageAction = createAction({
	auth: webflowAuth,
	name: 'webflow_get_page',
	outputSchema: webflowGetPageOutputSchema,
	displayName: 'Get Page',
	description: 'Gets the metadata of a page.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Gets one page's metadata: title, slug, parent folder, SEO and Open Graph settings, draft and archived state. Use Get Page Content for its text nodes. Get the page id from List Pages.",
		idempotent: true,
	},
	props: {
		pageId: webflowAiProps.pageId({ required: true }),
		localeId: Property.ShortText({
			displayName: 'Locale ID',
			description: 'Locale ID to read. Leave empty for the primary locale.',
			required: false,
		}),
		translatable: Property.ShortText({
			displayName: 'Translatable Into Locale ID',
			description: 'Secondary locale ID you are translating into. Returns only content not excluded from translation for that locale.',
			required: false,
		}),
	},
	async run(context) {
		const { pageId, localeId, translatable } = context.propsValue;
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/pages/${encodeURIComponent(pageId)}`,
			query: {
				...(localeId ? { localeId } : {}),
				...(translatable ? { translatable } : {}),
			},
		});
	},
});
