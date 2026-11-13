import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowCreateAssetFolderOutputSchema } from '../../../output-schemas';

export const createAssetFolderAction = createAction({
	auth: webflowAuth,
	name: 'webflow_create_asset_folder',
	outputSchema: webflowCreateAssetFolderOutputSchema,
	displayName: 'Create Asset Folder',
	description: 'Creates an asset folder on a site.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates an asset folder on a site, at the root or inside another folder. Upload Asset can then put files in it. Get the site id from List Sites and the parent folder id from List Asset Folders.',
		idempotent: false,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		displayName: Property.ShortText({
			displayName: 'Name',
			description: 'Name of the folder, e.g. "Blog images".',
			required: true,
		}),
		parentFolder: Property.ShortText({
			displayName: 'Parent Folder ID',
			description: 'Asset folder to create this folder in. Use List Asset Folders to find it. Defaults to the root.',
			required: false,
		}),
	},
	async run(context) {
		const { siteId, displayName, parentFolder } = context.propsValue;
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/v2/sites/${encodeURIComponent(siteId)}/asset_folders`,
			body: {
				displayName,
				...(parentFolder ? { parentFolder } : {}),
			},
		});
	},
});
