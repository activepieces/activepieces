import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowDeleteGoogleTagOutputSchema } from '../../../output-schemas';

export const deleteGoogleTagAction = createAction({
	auth: webflowAuth,
	name: 'webflow_delete_google_tag',
	outputSchema: webflowDeleteGoogleTagOutputSchema,
	displayName: 'Delete Google Tag',
	description: 'Removes one Google Tag ID from a site.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently removes one Google Tag ID from a site and renumbers the order of the rest. Get the tag id from List Google Tags and the site id from List Sites.',
		idempotent: false,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		tagId: Property.ShortText({
			displayName: 'Tag ID',
			description: 'Google Tag ID to remove, e.g. "G-1234567890". Use List Google Tags to find it.',
			required: true,
		}),
	},
	async run(context) {
		const { siteId, tagId } = context.propsValue;
		await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			path: `/v2/sites/${encodeURIComponent(siteId)}/integrations/google_tags/${encodeURIComponent(tagId)}`,
		});
		return { success: true, siteId, tagId };
	},
});
