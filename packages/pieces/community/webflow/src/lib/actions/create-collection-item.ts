import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';

import { webflowAuth } from '../..';
import { webflowProps } from '../common/props';
import { WebflowApiClient } from '../common/client';

export const webflowCreateCollectionItemAction = createAction({
	auth: webflowAuth,
	name: 'create_collection_item',
	displayName: 'Create Collection Item',
	description: 'Creates new collection item.',
	props: {
		site_id: webflowProps.site_id,
		collection_id: webflowProps.collection_id,
		collection_fields: webflowProps.collection_fields,
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

		const client = new WebflowApiClient(context.auth.access_token);
		const { fields: CollectionFields } = await client.getCollection(collectionId);

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

		return await client.createCollectionItem(collectionId, {
			fields: { ...formattedCollectionFields, _archived: isArchived, _draft: isDraft },
		});
	},
});
