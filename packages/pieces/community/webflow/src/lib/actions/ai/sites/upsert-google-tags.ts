import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowUpsertGoogleTagsOutputSchema } from '../../../output-schemas';

export const upsertGoogleTagsAction = createAction({
	auth: webflowAuth,
	name: 'webflow_upsert_google_tags',
	outputSchema: webflowUpsertGoogleTagsOutputSchema,
	displayName: 'Add or Update Google Tags',
	description: 'Adds Google Tag IDs to a site, or updates the ones it already has.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds the given Google Tag IDs to a site or updates their display name and order; tags not listed are kept. Use Delete Google Tag to remove one. Accepts G-, GT-, AW- and DC- ids, not UA-; a site holds at most 25 tags. Get the site id from List Sites.',
		idempotent: true,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		googleTagIds: Property.Array({
			displayName: 'Google Tags',
			description: 'Tags to add or update.',
			required: true,
			properties: {
				tagId: Property.ShortText({
					displayName: 'Tag ID',
					description: 'Google Tag ID, e.g. "G-1234567890".',
					required: true,
				}),
				displayName: Property.ShortText({
					displayName: 'Display Name',
					description: 'Label for the tag, e.g. "Main Analytics Tag".',
					required: true,
				}),
				order: Property.Number({
					displayName: 'Order',
					description: 'Display order. Webflow assigns one to new tags when empty.',
					required: false,
				}),
			},
		}),
	},
	async run(context) {
		const { siteId, googleTagIds } = context.propsValue;
		if (!googleTagIds || googleTagIds.length === 0) {
			throw new Error('googleTagIds must hold at least one tag.');
		}
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.PATCH,
			path: `/v2/sites/${encodeURIComponent(siteId)}/integrations/google_tags`,
			body: { googleTagIds },
		});
	},
});
