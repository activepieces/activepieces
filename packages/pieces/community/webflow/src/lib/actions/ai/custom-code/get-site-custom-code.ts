import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowGetPageCustomCodeOutputSchema } from '../../../output-schemas';

export const getSiteCustomCodeAction = createAction({
	auth: webflowAuth,
	name: 'webflow_get_site_custom_code',
	outputSchema: webflowGetPageCustomCodeOutputSchema,
	displayName: 'Get Site Custom Code',
	description: 'Gets the registered scripts applied to a site.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Returns the registered scripts applied site-wide, with each script's id, version and location (header or footer). A 404 means no custom code is applied to the site yet. Get the site id from List Sites.",
		idempotent: true,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
	},
	async run(context) {
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/sites/${encodeURIComponent(context.propsValue.siteId)}/custom_code`,
		});
	},
});
