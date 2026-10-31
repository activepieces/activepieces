import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowDeleteCustomFontOutputSchema } from '../../../output-schemas';

export const deleteCustomFontAction = createAction({
	auth: webflowAuth,
	name: 'webflow_delete_custom_font',
	outputSchema: webflowDeleteCustomFontOutputSchema,
	displayName: 'Delete Custom Font',
	description: 'Permanently deletes a custom font from a site.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one custom font from a site; it cannot be restored. To delete several at once, use Delete Custom Fonts Batch. Get the site id from List Sites and the font id from List Custom Fonts.',
		idempotent: false,
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
		await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			path: `/v2/sites/${encodeURIComponent(siteId)}/custom_fonts/${encodeURIComponent(fontId)}`,
		});
		return { success: true, siteId, fontId };
	},
});
