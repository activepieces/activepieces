import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowGetSiteOutputSchema } from '../../../output-schemas';

export const getSiteAction = createAction({
	auth: webflowAuth,
	name: 'webflow_get_site',
	outputSchema: webflowGetSiteOutputSchema,
	displayName: 'Get Site',
	description: 'Gets the details of a Webflow site.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Returns one site's details: name, short name, preview URL, time zone, locales, custom domains and last publish time. Get the site id from List Sites.",
		idempotent: true,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
	},
	async run(context) {
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/sites/${encodeURIComponent(context.propsValue.siteId)}`,
		});
	},
});
