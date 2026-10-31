import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowClient } from '../../../common/client';
import { webflowGetAssetOutputSchema } from '../../../output-schemas';

export const getAssetAction = createAction({
	auth: webflowAuth,
	name: 'webflow_get_asset',
	outputSchema: webflowGetAssetOutputSchema,
	displayName: 'Get Asset',
	description: 'Gets the details of an asset.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Returns one asset's details: file name, display name, alt text, hosted URL, size, content type, folder and image variants. Get the asset id from List Assets or Upload Asset.",
		idempotent: true,
	},
	props: {
		assetId: Property.ShortText({
			displayName: 'Asset ID',
			description: 'Asset ID. Use List Assets to find it.',
			required: true,
		}),
		localeId: Property.ShortText({
			displayName: 'Locale ID',
			description: 'Locale ID to read the localized alt text for. Get Site returns the site locales. Defaults to the primary locale.',
			required: false,
		}),
	},
	async run(context) {
		const { assetId, localeId } = context.propsValue;
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/assets/${encodeURIComponent(assetId)}`,
			query: {
				...(localeId ? { localeId } : {}),
			},
		});
	},
});
