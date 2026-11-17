import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowClient } from '../../../common/client';
import { webflowCreateAssetFolderOutputSchema } from '../../../output-schemas';

export const getAssetFolderAction = createAction({
	auth: webflowAuth,
	name: 'webflow_get_asset_folder',
	outputSchema: webflowCreateAssetFolderOutputSchema,
	displayName: 'Get Asset Folder',
	description: 'Gets the details of an asset folder.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Returns one asset folder's name, parent folder and the ids of the assets it holds. Get the folder id from List Asset Folders or Create Asset Folder.",
		idempotent: true,
	},
	props: {
		assetFolderId: Property.ShortText({
			displayName: 'Asset Folder ID',
			description: 'Asset folder ID. Use List Asset Folders to find it.',
			required: true,
		}),
	},
	async run(context) {
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/asset_folders/${encodeURIComponent(context.propsValue.assetFolderId)}`,
		});
	},
});
