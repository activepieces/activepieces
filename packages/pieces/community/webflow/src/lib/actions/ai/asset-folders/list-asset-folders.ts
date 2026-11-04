import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowListAssetFoldersOutputSchema } from '../../../output-schemas';

export const listAssetFoldersAction = createAction({
	auth: webflowAuth,
	name: 'webflow_list_asset_folders',
	outputSchema: webflowListAssetFoldersOutputSchema,
	displayName: 'List Asset Folders',
	description: 'Lists the asset folders of a site.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists the asset folders of a site, with each folder's id, name, parent folder and the asset ids it holds. Get the site id from List Sites.",
		idempotent: true,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
	},
	async run(context) {
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/sites/${encodeURIComponent(context.propsValue.siteId)}/asset_folders`,
		});
	},
});
