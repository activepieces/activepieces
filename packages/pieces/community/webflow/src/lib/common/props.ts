import {
	DropdownOption,
	DynamicPropsValue,
	PiecePropValueSchema,
	Property,
} from '@activepieces/pieces-framework';

import { WebflowApiClient } from './client';
import { webflowAuth } from '../..';

export const webflowProps = {
	site_id: Property.Dropdown({
		displayName: 'Site',
		required: true,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect account first.',
				};
			}
			const authValue = auth as PiecePropValueSchema<typeof webflowAuth>;
			const client = new WebflowApiClient(authValue.access_token);

			const { sites } = await client.listSites();

			const options: DropdownOption<string>[] = [];
			for (const site of sites) {
				options.push({ label: site.displayName, value: site.id });
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
	collection_id: Property.Dropdown({
		displayName: 'Collection',
		required: true,
		refreshers: ['site_id'],
		options: async ({ auth, site_id }) => {
			if (!auth || !site_id) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect account first.',
				};
			}
			const authValue = auth as PiecePropValueSchema<typeof webflowAuth>;
			const client = new WebflowApiClient(authValue.access_token);

			const { collections } = await client.listCollections(site_id as string);

			const options: DropdownOption<string>[] = [];
			for (const collection of collections) {
				options.push({ label: collection.displayName, value: collection.id });
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
	collection_fields: Property.DynamicProperties({
		displayName: 'Collection Fields',
		required: true,
		refreshers: ['collection_id'],
		props: async ({ auth, collection_id }) => {
			if (!auth) return {};
			if (!collection_id) return {};

			const collectionFields: DynamicPropsValue = {};
			const authValue = auth as PiecePropValueSchema<typeof webflowAuth>;
			const client = new WebflowApiClient(authValue.access_token);

			const { fields } = await client.getCollection(collection_id as unknown as string);

			for (const field of fields) {
				switch (field.type) {
					case 'Option':
						collectionFields[field.slug] = Property.StaticDropdown({
							displayName: field.displayName,
							required: false,
							options: {
								disabled: false,
								options: field.validations.options.map((option: { name: string }) => {
									return {
										label: option.name,
										value: option.name,
									};
								}),
							},
						});
						break;
					case 'RichText':
					case 'Email':
					case 'PlainText':
					case 'Phone':
					case 'Link':
					case 'VideoLink':
					case 'Color':
					case 'Reference':
						collectionFields[field.slug] = Property.ShortText({
							displayName: field.displayName,
							required: false,
						});
						break;
					case 'Image':
						collectionFields[field.slug] = Property.ShortText({
							displayName: field.displayName,
							required: false,
							description:
								' Images must be hosted on a publicly accessible URL to be uploaded via the API.The maximum file size for images is 4MB.',
						});
						break;
					case 'MultiImage':
						collectionFields[field.slug] = Property.Array({
							displayName: field.displayName,
							required: false,
							description:
								' Images must be hosted on a publicly accessible URL to be uploaded via the API.The maximum file size for images is 4MB.',
						});
						break;
					case 'MultiReference':
						collectionFields[field.slug] = Property.Array({
							displayName: field.displayName,
							required: false,
						});
						break;
					case 'Number':
						collectionFields[field.slug] = Property.Number({
							displayName: field.displayName,
							required: false,
						});
						break;
					case 'DateTime':
						collectionFields[field.slug] = Property.DateTime({
							displayName: field.displayName,
							required: false,
						});
						break;
					case 'Switch':
						collectionFields[field.slug] = Property.Checkbox({
							displayName: field.displayName,
							required: false,
						});
						break;
				}
			}
			return collectionFields;
		},
	}),
	collection_item_id: Property.Dropdown({
		displayName: 'Collection Item',
		required: true,
		refreshers: ['collection_id'],
		options: async ({ auth, collection_id }) => {
			if (!auth || !collection_id) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect account first.',
				};
			}
			const authValue = auth as PiecePropValueSchema<typeof webflowAuth>;
			const client = new WebflowApiClient(authValue.access_token);

			const options: DropdownOption<string>[] = [];

			let page = 0;
			let response;
			do {
				response = await client.listCollectionItems(collection_id as string, page, 100);
				page += 100;

				for (const item of response.items) {
					options.push({ label: item.fieldData.name, value: item.id });
				}
			} while (response.items.length > 0);

			return {
				disabled: false,
				options,
			};
		},
	}),
	order_id: Property.Dropdown({
		displayName: 'Order',
		required: true,
		refreshers: ['site_id'],
		options: async ({ auth, site_id }) => {
			if (!auth || !site_id) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect account first.',
				};
			}
			const authValue = auth as PiecePropValueSchema<typeof webflowAuth>;
			const client = new WebflowApiClient(authValue.access_token);

			const options: DropdownOption<string>[] = [];

			let page = 0;
			let response;
			do {
				response = await client.listOrders(site_id as string, page, 100);
				page += 100;

				for (const orders of response.orders) {
					options.push({ label: orders.orderId, value: orders.orderId });
				}
			} while (response.orders.length > 0);

			return {
				disabled: false,
				options,
			};
		},
	}),
};
