import { HttpMethod } from '@activepieces/pieces-common';
import {
	DropdownOption,
	DropdownState,
	DynamicPropsValue,
	Property,
} from '@activepieces/pieces-framework';
import { webflowAuth } from '../auth';
import { webflowApi } from './api';
import { webflowClient } from './client';
import type { WebflowCollectionItemsPage, WebflowOrder } from './types';

function siteId<R extends boolean>({ required, displayName = 'Site', description }: PropParams<R>) {
	return Property.Dropdown({
		auth: webflowAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Please connect account first.' });
			}
			const sites = await webflowApi.listSites({ auth });
			return {
				disabled: false,
				options: sites.map((site) => ({ label: site.name, value: site._id })),
			};
		},
	});
}

function collectionId<R extends boolean>({ required, displayName = 'Collection', description }: PropParams<R>) {
	return Property.Dropdown({
		auth: webflowAuth,
		displayName,
		description,
		required,
		refreshers: ['site_id'],
		options: async ({ auth, site_id }) => {
			if (!auth || !site_id) {
				return disabledOptions({ placeholder: 'Please connect account first.' });
			}
			const collections = await webflowApi.listCollections({ auth, siteId: String(site_id) });
			return {
				disabled: false,
				options: collections.map((collection) => ({ label: collection.name, value: collection._id })),
			};
		},
	});
}

function collectionFields<R extends boolean>({
	required,
	displayName = 'Collection Fields',
	description,
}: PropParams<R>) {
	return Property.DynamicProperties({
		auth: webflowAuth,
		displayName,
		description,
		required,
		refreshers: ['collection_id'],
		props: async ({ auth, collection_id }) => {
			if (!auth) return {};
			if (!collection_id) return {};

			const collectionFields: DynamicPropsValue = {};
			const { fields } = await webflowApi.getCollection({ auth, collectionId: String(collection_id) });

			for (const field of fields) {
				if (field.editable && field.slug !== '_archived' && field.slug !== '_draft') {
					switch (field.type) {
						case 'Option':
							collectionFields[field.slug] = Property.StaticDropdown({
								displayName: field.name,
								required: field.required,
								options: {
									disabled: false,
									options: field.validations.options.map((option) => {
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
								description:
									'Images must be hosted on a publicly accessible URL to be uploaded via the API.The maximum file size for images is 4MB.',
							});
							break;
						case 'Set':
							collectionFields[field.slug] = Property.Array({
								displayName: field.name,
								required: field.required,
								description:
									' Images must be hosted on a publicly accessible URL to be uploaded via the API.The maximum file size for images is 4MB.',
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
	});
}

function collectionItemId<R extends boolean>({
	required,
	displayName = 'Collection Item',
	description,
}: PropParams<R>) {
	return Property.Dropdown({
		auth: webflowAuth,
		displayName,
		description,
		required,
		refreshers: ['collection_id'],
		options: async ({ auth, collection_id }) => {
			if (!auth || !collection_id) {
				return disabledOptions({ placeholder: 'Please connect account first.' });
			}
			const options: DropdownOption<string>[] = [];

			let page = 0;
			let response: WebflowCollectionItemsPage;
			do {
				response = await webflowClient.request<WebflowCollectionItemsPage>({
					auth,
					method: HttpMethod.GET,
					path: `/collections/${String(collection_id)}/items`,
					query: { offset: String(page), limit: '100' },
				});
				page += 100;

				for (const item of response.items) {
					options.push({ label: item.name, value: item._id });
				}
			} while (response.items.length > 0);

			return {
				disabled: false,
				options,
			};
		},
	});
}

function orderId<R extends boolean>({ required, displayName = 'Order', description }: PropParams<R>) {
	return Property.Dropdown({
		auth: webflowAuth,
		displayName,
		description,
		required,
		refreshers: ['site_id'],
		options: async ({ auth, site_id }) => {
			if (!auth || !site_id) {
				return disabledOptions({ placeholder: 'Please connect account first.' });
			}
			const options: DropdownOption<string>[] = [];

			let page = 0;
			let response: WebflowOrder[];
			do {
				response = await webflowClient.request<WebflowOrder[]>({
					auth,
					method: HttpMethod.GET,
					path: `/sites/${String(site_id)}/orders`,
					query: { offset: String(page), limit: '100' },
				});
				page += 100;

				for (const order of response) {
					options.push({ label: order.orderId, value: order.orderId });
				}
			} while (response.length > 0);

			return {
				disabled: false,
				options,
			};
		},
	});
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
	return { disabled: true, options: [], placeholder };
}

export const webflowProps = { siteId, collectionId, collectionFields, collectionItemId, orderId };

export type PropParams<R extends boolean> = { required: R; displayName?: string; description?: string };
