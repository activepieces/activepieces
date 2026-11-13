import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowDeleteCustomFontsBatchOutputSchema } from '../../../output-schemas';

export const deleteCustomFontsBatchAction = createAction({
	auth: webflowAuth,
	name: 'webflow_delete_custom_fonts_batch',
	outputSchema: webflowDeleteCustomFontsBatchOutputSchema,
	displayName: 'Delete Custom Fonts (Batch)',
	description: 'Permanently deletes up to 100 custom fonts from a site.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes 1-100 custom fonts from a site in one request. Webflow reports each font in deleted or failed (a missing font fails with NotFound) instead of failing the whole call, so check failed and resend only those ids. Get the site id from List Sites and the font ids from List Custom Fonts.',
		idempotent: false,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		fontIds: Property.Array({
			displayName: 'Font IDs',
			description: 'Ids of the custom fonts to delete, 1-100. Use List Custom Fonts to find them.',
			required: true,
		}),
	},
	async run(context) {
		const { siteId, fontIds } = context.propsValue;
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/v2/sites/${encodeURIComponent(siteId)}/custom_fonts/batchDelete`,
			body: { items: fontIds.map((id) => ({ id: String(id) })) },
		});
	},
});
