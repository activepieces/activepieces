import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowGetPageContentOutputSchema } from '../../../output-schemas';

export const getPageContentAction = createAction({
	auth: webflowAuth,
	name: 'webflow_get_page_content',
	outputSchema: webflowGetPageContentOutputSchema,
	displayName: 'Get Page Content',
	description: 'Gets the content nodes of a page.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Gets a static page's content as nodes (text, images, component instances, form elements) with their ids. Pages with limit and offset. Use Get Page for title, slug and SEO. Get the page id from List Pages.",
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
		limit: webflowAiProps.limit({ required: false }),
		offset: webflowAiProps.offset({ required: false }),
	},
	async run(context) {
		const { pageId, localeId, translatable, limit, offset } = context.propsValue;
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/pages/${encodeURIComponent(pageId)}/dom`,
			query: {
				limit: String(limit ?? 100),
				offset: String(offset ?? 0),
				...(localeId ? { localeId } : {}),
				...(translatable ? { translatable } : {}),
			},
		});
	},
});
