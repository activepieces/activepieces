import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowGetPageCustomCodeOutputSchema } from '../../../output-schemas';

export const upsertSiteCustomCodeAction = createAction({
	auth: webflowAuth,
	name: 'webflow_upsert_site_custom_code',
	outputSchema: webflowGetPageCustomCodeOutputSchema,
	displayName: 'Upsert Site Custom Code',
	description: 'Applies registered scripts to a site, replacing the scripts applied before.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets the registered scripts applied to a site. The PUT replaces the whole list, so include every script that should stay applied (read them first with Get Site Custom Code); a script left out is removed. Register a script first with Register Hosted Script or Register Inline Script. Get the site id from List Sites.',
		idempotent: true,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		scripts: Property.Json({
			displayName: 'Scripts',
			description:
				'The full list of scripts to apply, as a JSON array of {"id", "version", "location": "header" | "footer", "attributes"?: {}}. id and version come from Register Hosted Script, Register Inline Script or List Registered Scripts. Send [] to remove all.',
			required: true,
		}),
	},
	async run(context) {
		const { siteId, scripts } = context.propsValue;
		if (!Array.isArray(scripts)) {
			throw new Error('scripts must be a JSON array of {"id", "version", "location"} objects.');
		}
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.PUT,
			path: `/v2/sites/${encodeURIComponent(siteId)}/custom_code`,
			body: { scripts },
		});
	},
});
