import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowClient } from '../../../common/client';
import { webflowDeleteAssetOutputSchema } from '../../../output-schemas';

export const deleteAssetAction = createAction({
	auth: webflowAuth,
	name: 'webflow_delete_asset',
	outputSchema: webflowDeleteAssetOutputSchema,
	displayName: 'Delete Asset',
	description: 'Permanently deletes an asset.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes an asset from the site; it cannot be restored. Get the asset id from List Assets or Upload Asset.',
		idempotent: false,
	},
	props: {
		assetId: Property.ShortText({
			displayName: 'Asset ID',
			description: 'Asset ID. Use List Assets to find it.',
			required: true,
		}),
	},
	async run(context) {
		const { assetId } = context.propsValue;
		await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			path: `/v2/assets/${encodeURIComponent(assetId)}`,
		});
		return { success: true, assetId };
	},
});
