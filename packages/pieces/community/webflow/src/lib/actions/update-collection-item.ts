import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../auth';
import { webflowApi } from '../common/api';
import { webflowClient } from '../common/client';
import { webflowProps } from '../common/props';

export const updateCollectionItemAction = createAction({
	auth: webflowAuth,
	name: 'update_collection_item',
	classification: 'WRITE',
	description: 'Update collection item',
	displayName: 'Update an item in a collection',
	audience: 'both',
	aiMetadata: { description: 'Updates an existing Webflow CMS collection item, identified by collection ID and item ID, overwriting the supplied field values (keyed by field slug) and the archived/draft flags. Use to edit existing CMS content. Idempotent: applying the same field values repeatedly yields the same item state.', idempotent: true },
	props: {
		site_id: webflowProps.siteId({ required: true }),
		collection_id: webflowProps.collectionId({ required: true }),
		collection_item_id: webflowProps.collectionItemId({ required: true }),
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
		const collectionItemId = context.propsValue.collection_item_id;
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
						if (fieldValue.length > 0) {
							formattedCollectionFields[field.slug] = fieldValue.map((url: string) => ({
								url: url,
							}));
						}
						break;
					case 'ItemRefSet':
						if (fieldValue.length > 0) {
							formattedCollectionFields[field.slug] = fieldValue;
						}
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
			method: HttpMethod.PUT,
			path: `/collections/${collectionId}/items/${collectionItemId}`,
			body: {
				fields: { ...formattedCollectionFields, _archived: isArchived, _draft: isDraft },
			},
		});
	},
});
