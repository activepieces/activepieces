import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowClient } from '../../../common/client';
import { webflowGetAssetOutputSchema } from '../../../output-schemas';

export const updateAssetAction = createAction({
	auth: webflowAuth,
	name: 'webflow_update_asset',
	outputSchema: webflowGetAssetOutputSchema,
	displayName: 'Update Asset',
	description: 'Updates the display name or alt text of an asset.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Sets an asset's display name and/or alt text; fields left empty keep their value. Set at least one. Alt text is per locale, the display name is not. Get the asset id from List Assets or Upload Asset.",
		idempotent: true,
	},
	props: {
		assetId: Property.ShortText({
			displayName: 'Asset ID',
			description: 'Asset ID. Use List Assets to find it.',
			required: true,
		}),
		displayName: Property.ShortText({
			displayName: 'Display Name',
			description: 'New human-readable name for the asset.',
			required: false,
		}),
		altText: Property.ShortText({
			displayName: 'Alt Text',
			description: 'New alternate text describing the image.',
			required: false,
		}),
		localeId: Property.ShortText({
			displayName: 'Locale ID',
			description: 'Locale ID to set the alt text for. Get Site returns the site locales. Defaults to the primary locale.',
			required: false,
		}),
	},
	async run(context) {
		const { assetId, displayName, altText, localeId } = context.propsValue;
		if (displayName === undefined && altText === undefined) {
			throw new Error('Set displayName or altText.');
		}
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.PATCH,
			path: `/v2/assets/${encodeURIComponent(assetId)}`,
			query: {
				...(localeId ? { localeId } : {}),
			},
			body: {
				...(displayName !== undefined ? { displayName } : {}),
				...(altText !== undefined ? { altText } : {}),
			},
		});
	},
});
