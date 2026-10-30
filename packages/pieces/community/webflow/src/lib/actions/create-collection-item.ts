import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../auth';
import { webflowApi } from '../common/api';
import { webflowClient } from '../common/client';
import { webflowProps } from '../common/props';

export const createCollectionItemAction = createAction({
	auth: webflowAuth,
	name: 'create_collection_item',
	classification: 'WRITE',
	displayName: 'Create Collection Item',
	description: 'Creates new collection item.',
	audience: 'both',
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

		const { fields: CollectionFields } = await webflowApi.getCollection({
			auth: context.auth,
			collectionId,
		});

		const formattedCollectionFields: DynamicPropsValue = {};
		for (const field of CollectionFields) {
			const fieldValue = collectionInputFields[field.slug];

			if (fieldValue !== undefined && fieldValue !== '') {
				switch (field.type) {
					case 'ImageRef':
					case 'FileRef':
						formattedCollectionFields[field.slug] = { url: fieldValue };
						break;
					case 'Set':
						formattedCollectionFields[field.slug] = fieldValue.map((url: string) => ({ url: url }));
						break;
					case 'Number':
						formattedCollectionFields[field.slug] = Number(fieldValue);
						break;
					default:
						formattedCollectionFields[field.slug] = fieldValue;
				}
			}
		}

		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/collections/${collectionId}/items`,
			body: {
				fields: { ...formattedCollectionFields, _archived: isArchived, _draft: isDraft },
			},
		});
	},
});
