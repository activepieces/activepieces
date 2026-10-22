import { createAction, DynamicPropsValue, MarkdownVariant, Property } from '@activepieces/pieces-framework';

import { webflowAuth } from '../..';
import { webflowProps } from '../common/props';
import { WebflowApiClient } from '../common/client';

export const webflowCreateCollectionItemAction = createAction({
	auth: webflowAuth,
	name: 'create_collection_item',
	classification: 'WRITE',
	displayName: 'Create Collection Item',
	description: 'Adds a new item to a CMS collection.',
	audience: 'both',
	aiMetadata: { description: 'Creates a new item in a Webflow CMS collection. Provide the collection ID and the field values (keyed by field slug); optionally mark the item as archived or draft. Use to add CMS content like blog posts or products. Each call creates a distinct item, so it is not idempotent.', idempotent: false },
	propertyGroups: [
		{ key: 'destination', display: 'section', label: 'Add To', icon: 'inbox', props: ['site_id', 'collection_id'] },
		{ key: 'item', display: 'section', label: 'Item', icon: 'text', props: ['collection_fields'] },
		{ key: 'status', display: 'section', label: 'Status', icon: 'sliders', props: ['is_draft', 'is_archived', 'publish_note'] },
	],
	props: {
		site_id: webflowProps.site_id,
		collection_id: webflowProps.collection_id,
		collection_fields: webflowProps.collection_fields,
		is_draft: Property.Checkbox({
			displayName: 'Draft',
			description: 'Drafts stay off the live site, even after a site publish.',
			required: false,
			defaultValue: false,
			width: 'half',
		}),
		is_archived: Property.Checkbox({
			displayName: 'Archived',
			description: 'Archived items are hidden from the site and collection lists.',
			required: false,
			defaultValue: false,
			width: 'half',
		}),
		publish_note: Property.MarkDown({
			value: 'New items reach the live site when it is next published, or with **Publish Collection Item**.',
			variant: MarkdownVariant.INFO,
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
