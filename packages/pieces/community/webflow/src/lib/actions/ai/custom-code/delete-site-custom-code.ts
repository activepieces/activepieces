import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowDeleteGoogleTagsOutputSchema } from '../../../output-schemas';

export const deleteSiteCustomCodeAction = createAction({
	auth: webflowAuth,
	name: 'webflow_delete_site_custom_code',
	outputSchema: webflowDeleteGoogleTagsOutputSchema,
	displayName: 'Delete Site Custom Code',
	description: 'Removes all scripts this app applied to a site.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Removes every script this app applied to a site. The scripts stay registered on the site and can be applied again with Upsert Site Custom Code; to remove only some scripts, use Upsert Site Custom Code without them. Get the site id from List Sites.',
		idempotent: false,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
	},
	async run(context) {
		await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			path: `/v2/sites/${encodeURIComponent(context.propsValue.siteId)}/custom_code`,
		});
		return { success: true, siteId: context.propsValue.siteId };
	},
});
