import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowCreateCollectionItemOutputSchema } from '../../../output-schemas';

export const createCollectionItemAiAction = createAction({
	auth: webflowAuth,
	name: 'webflow_create_collection_item',
	outputSchema: webflowCreateCollectionItemOutputSchema,
	displayName: 'Create Collection Item',
	description: 'Creates a staged item in a CMS collection.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates one staged item in a CMS collection. Field Data is keyed by field slug (from Get Collection) and must include name and slug; Option fields take the option id, Reference fields the referenced item id, Image and File fields {"url": "..."}. New items are drafts unless isDraft is "false". The item reaches the live site with Publish Collection Items or a site publish; use Create Live Collection Item to publish at once. Get the collection id from List Collections.',
		idempotent: false,
	},
	props: {
		collectionId: webflowAiProps.collectionId({ required: true }),
		fieldData: Property.Json({
			displayName: 'Field Data',
			description:
				'Field values keyed by field slug, e.g. {"name": "My post", "slug": "my-post", "summary": "..."}. name and slug are required.',
			required: true,
		}),
		isDraft: webflowAiProps.flag({
			required: false,
			displayName: 'Is Draft',
			description: 'Webflow creates items as drafts unless this is "false". Drafts are not published with the site.',
		}),
		isArchived: webflowAiProps.flag({
			required: false,
			displayName: 'Is Archived',
			description: 'Archived items are hidden from the site. Defaults to false.',
		}),
	},
	async run(context) {
		const { collectionId, fieldData, isDraft, isArchived } = context.propsValue;
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/v2/collections/${encodeURIComponent(collectionId)}/items`,
			body: {
				fieldData,
				...(isDraft !== undefined ? { isDraft: isDraft === 'true' } : {}),
				...(isArchived !== undefined ? { isArchived: isArchived === 'true' } : {}),
			},
		});
	},
});
