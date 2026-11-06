import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowCreateCustomFontOutputSchema } from '../../../output-schemas';

export const getCustomFontAction = createAction({
	auth: webflowAuth,
	name: 'webflow_get_custom_font',
	outputSchema: webflowCreateCustomFontOutputSchema,
	displayName: 'Get Custom Font',
	description: 'Gets one custom font on a site.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Returns one custom font on a site, with its family, weight, style, font-display, variable axes and hosted URL. Get the site id from List Sites and the font id from List Custom Fonts.",
		idempotent: true,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		fontId: Property.ShortText({
			displayName: 'Font ID',
			description: 'Custom font ID. Use List Custom Fonts to find it.',
			required: true,
		}),
	},
	async run(context) {
		const { siteId, fontId } = context.propsValue;
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/sites/${encodeURIComponent(siteId)}/custom_fonts/${encodeURIComponent(fontId)}`,
		});
	},
});
