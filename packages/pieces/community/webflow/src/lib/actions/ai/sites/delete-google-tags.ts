import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowDeleteGoogleTagsOutputSchema } from '../../../output-schemas';

export const deleteGoogleTagsAction = createAction({
	auth: webflowAuth,
	name: 'webflow_delete_google_tags',
	outputSchema: webflowDeleteGoogleTagsOutputSchema,
	displayName: 'Delete All Google Tags',
	description: 'Removes every Google Tag ID from a site.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently removes every Google Tag ID from a site. To remove a single tag use Delete Google Tag. Get the site id from List Sites.',
		idempotent: false,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
	},
	async run(context) {
		await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			path: `/v2/sites/${encodeURIComponent(context.propsValue.siteId)}/integrations/google_tags`,
		});
		return { success: true, siteId: context.propsValue.siteId };
	},
});
