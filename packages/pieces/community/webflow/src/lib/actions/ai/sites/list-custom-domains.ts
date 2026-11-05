import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowListCustomDomainsOutputSchema } from '../../../output-schemas';

export const listCustomDomainsAction = createAction({
	auth: webflowAuth,
	name: 'webflow_list_custom_domains',
	outputSchema: webflowListCustomDomainsOutputSchema,
	displayName: 'List Custom Domains',
	description: 'Lists the custom domains of a site.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists the custom domains attached to a site, with each domain's id, URL and last publish time. Use the ids with Publish Site to publish to specific domains. Get the site id from List Sites.",
		idempotent: true,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
	},
	async run(context) {
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/sites/${encodeURIComponent(context.propsValue.siteId)}/custom_domains`,
		});
	},
});
