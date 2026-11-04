import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowListCollectionsOutputSchema } from '../../../output-schemas';

export const listCollectionsAiAction = createAction({
	auth: webflowAuth,
	name: 'webflow_list_collections',
	outputSchema: webflowListCollectionsOutputSchema,
	displayName: 'List Collections',
	description: 'Lists the CMS collections of a site.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists the CMS collections of a site with each collection's id, name and slug. Use Get Collection for a collection's fields. Get the site id from List Sites.",
		idempotent: true,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
	},
	async run(context) {
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/sites/${encodeURIComponent(context.propsValue.siteId)}/collections`,
		});
	},
});
