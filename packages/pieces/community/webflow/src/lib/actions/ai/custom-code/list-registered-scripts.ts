import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowListRegisteredScriptsOutputSchema } from '../../../output-schemas';

export const listRegisteredScriptsAction = createAction({
	auth: webflowAuth,
	name: 'webflow_list_registered_scripts',
	outputSchema: webflowListRegisteredScriptsOutputSchema,
	displayName: 'List Registered Scripts',
	description: 'Lists the scripts registered to a site.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists the scripts registered to a site (up to 800), with each script's id, version, display name and hosted location. Registered scripts are not live until applied with Upsert Site Custom Code or Upsert Page Custom Code. Get the site id from List Sites.",
		idempotent: true,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
	},
	async run(context) {
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/sites/${encodeURIComponent(context.propsValue.siteId)}/registered_scripts`,
		});
	},
});
