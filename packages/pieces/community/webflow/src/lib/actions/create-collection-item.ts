import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../auth';
import { webflowApi } from '../common/api';
import { webflowClient } from '../common/client';
import { webflowProps } from '../common/props';
import { webflowUtils } from '../common/utils';
import { createCollectionItemOutputSchema } from '../output-schemas';

export const createCollectionItemAction = createAction({
	auth: webflowAuth,
	name: 'create_collection_item',
	outputSchema: createCollectionItemOutputSchema,
	classification: 'WRITE',
	displayName: 'Create Collection Item',
	description: 'Creates new collection item.',
	audience: 'human',
	aiMetadata: { description: 'Creates a new item in a Webflow CMS collection. Provide the collection ID and the field values (keyed by field slug); optionally mark the item as archived or draft. Use to add CMS content like blog posts or products. Each call creates a distinct item, so it is not idempotent.', idempotent: false },
	props: {
		site_id: webflowProps.siteId({ required: true }),
		collection_id: webflowProps.collectionId({ required: true }),
		collection_fields: webflowProps.collectionFields({ required: true }),
		is_archived: Property.Checkbox({
			displayName: 'Is Archived',
			description: 'Whether the item is archived or not',
			required: false,
		}),
		is_draft: Property.Checkbox({
			displayName: 'Is Draft',
			description: 'Whether the item is a draft or not',
			required: false,
		}),
	},
	async run(context) {
		const collectionId = context.propsValue.collection_id;
		const isArchived = context.propsValue.is_archived;
		const isDraft = context.propsValue.is_draft;
		const collectionInputFields = context.propsValue.collection_fields;

		const { fields } = await webflowApi.getCollection({
			auth: context.auth,
			collectionId,
		});

		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/v2/collections/${encodeURIComponent(collectionId)}/items`,
			body: {
				isArchived: isArchived ?? false,
				isDraft: isDraft ?? false,
				fieldData: webflowUtils.formatFieldData({ fields, values: collectionInputFields }),
			},
		});
	},
});
