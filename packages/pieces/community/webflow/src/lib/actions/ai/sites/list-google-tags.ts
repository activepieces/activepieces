import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowListGoogleTagsOutputSchema } from '../../../output-schemas';

export const listGoogleTagsAction = createAction({
	auth: webflowAuth,
	name: 'webflow_list_google_tags',
	outputSchema: webflowListGoogleTagsOutputSchema,
	displayName: 'List Google Tags',
	description: 'Lists the Google Tag IDs configured on a site.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists the Google Tag IDs (G-, GT-, AW-, DC-) configured on a site, with each tag's display name and order. Get the site id from List Sites.",
		idempotent: true,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
	},
	async run(context) {
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/sites/${encodeURIComponent(context.propsValue.siteId)}/integrations/google_tags`,
		});
	},
});
