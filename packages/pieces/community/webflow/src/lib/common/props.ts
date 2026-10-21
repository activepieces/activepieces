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
		auth: webflowAuth,

		displayName: 'Site',
		required: true,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Connect your Webflow account first.',
				};
			}
			const authValue = auth;
			const client = new WebflowApiClient(authValue.access_token);

			const sites = await client.listSites();

			const options: DropdownOption<string>[] = [];
			for (const site of sites) {
				options.push({ label: site.name, value: site._id });
			}

			if (options.length === 0) {
				return {
					disabled: false,
					options: [],
					placeholder: 'No sites found for this account.',
				};
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
	collection_id: Property.Dropdown({
		auth: webflowAuth,

		displayName: 'Collection',
		required: true,
		refreshers: ['site_id'],
		options: async ({ auth, site_id }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Connect your Webflow account first.',
				};
			}
			if (!site_id) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Select a site first.',
				};
			}
			const authValue = auth as PiecePropValueSchema<typeof webflowAuth>;
			const client = new WebflowApiClient(authValue.access_token);

			const collections = await client.listCollections(site_id as string);

			const options: DropdownOption<string>[] = [];
			for (const collection of collections) {
				options.push({ label: collection.name, value: collection._id });
			}

			if (options.length === 0) {
				return {
					disabled: false,
					options: [],
					placeholder: 'This site has no CMS collections.',
				};
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
	collection_fields: Property.DynamicProperties({
		auth: webflowAuth,
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
				if (field.editable && field.slug !== '_archived' && field.slug !== '_draft') {
					switch (field.type) {
						case 'Option':
							collectionFields[field.slug] = Property.StaticDropdown({
								displayName: field.name,
								required: field.required,
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
						case 'Video':
						case 'Color':
						case 'ItemRef':
						case 'FileRef':
							collectionFields[field.slug] = Property.ShortText({
								displayName: field.name,
								required: field.required,
							});
							break;
						case 'ImageRef':
							collectionFields[field.slug] = Property.ShortText({
								displayName: field.name,
								required: field.required,
								description: 'Public image URL, up to 4 MB.',
							});
							break;
						case 'Set':
							collectionFields[field.slug] = Property.Array({
								displayName: field.name,
								required: field.required,
								description: 'Public image URLs, up to 4 MB each.',
							});
							break;
						case 'ItemRefSet':
							collectionFields[field.slug] = Property.Array({
								displayName: field.name,
								required: field.required,
							});
							break;
						case 'Number':
							collectionFields[field.slug] = Property.Number({
								displayName: field.name,
								required: field.required,
							});
							break;
						case 'Date':
							collectionFields[field.slug] = Property.DateTime({
								displayName: field.name,
								required: field.required,
							});
							break;
						case 'Bool':
							collectionFields[field.slug] = Property.Checkbox({
								displayName: field.name,
								required: false,
							});
							break;
					}
				}
			}
			return collectionFields;
		},
	}),
	collection_item_id: Property.Dropdown({
		auth: webflowAuth,

		displayName: 'Collection Item',
		required: true,
		refreshers: ['collection_id'],
		options: async ({ auth, collection_id }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Connect your Webflow account first.',
				};
			}
			if (!collection_id) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Select a collection first.',
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
					options.push({ label: item.name ?? item.slug ?? item._id, value: item._id });
				}
			} while (response.items.length >= 100);

			if (options.length === 0) {
				return {
					disabled: false,
					options: [],
					placeholder: 'This collection has no items yet.',
				};
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
	order_id: Property.Dropdown({
		auth: webflowAuth,

		displayName: 'Order',
		required: true,
		refreshers: ['site_id'],
		options: async ({ auth, site_id }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Connect your Webflow account first.',
				};
			}
			if (!site_id) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Select a site first.',
				};
			}
			const authValue = auth as PiecePropValueSchema<typeof webflowAuth>;
			const client = new WebflowApiClient(authValue.access_token);

			const options: DropdownOption<string>[] = [];

			let page = 0;
			let response: WebflowOrderOption[];
			do {
				response = await client.listOrders(site_id as string, page, 100);
				page += 100;

				for (const order of response) {
					options.push({ label: orderOptionLabel(order), value: order.orderId });
				}
			} while (response.length >= 100);

			if (options.length === 0) {
				return {
					disabled: false,
					options: [],
					placeholder: 'This site has no orders yet.',
				};
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
};

function orderOptionLabel(order: WebflowOrderOption): string {
	const fullName = order.customerInfo?.fullName;
	return [
		`#${order.orderId}`,
		...(fullName ? [`· ${fullName}`] : []),
		...(order.status ? [`(${order.status})`] : []),
	].join(' ');
}

type WebflowOrderOption = {
	orderId: string;
	status?: string;
	customerInfo?: {
		fullName?: string;
	};
};
