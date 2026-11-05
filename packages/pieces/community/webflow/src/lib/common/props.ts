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
import type { WebflowCollectionItemsPage, WebflowOrdersPage } from './types';

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
				options: sites.map((site) => ({ label: site.displayName, value: site.id })),
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
				options: collections.map((collection) => ({ label: collection.displayName, value: collection.id })),
			};
		},
	});
}

function collectionFields<R extends boolean>({
	required,
	displayName = 'Collection Fields',
	description,
	optionalFields = false,
}: PropParams<R> & { optionalFields?: boolean }) {
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
				if (!field.isEditable) {
					continue;
				}
				switch (field.type) {
					case 'Option':
						collectionFields[field.slug] = Property.StaticDropdown({
							displayName: field.displayName,
							required: !optionalFields && field.isRequired,
							options: {
								disabled: false,
								options: (field.validations?.options ?? []).map((option) => ({
									label: option.name,
									value: option.name,
								})),
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
					case 'File':
						collectionFields[field.slug] = Property.ShortText({
							displayName: field.displayName,
							required: !optionalFields && field.isRequired,
						});
						break;
					case 'Image':
						collectionFields[field.slug] = Property.ShortText({
							displayName: field.displayName,
							required: !optionalFields && field.isRequired,
							description:
								'Images must be hosted on a publicly accessible URL to be uploaded via the API.The maximum file size for images is 4MB.',
						});
						break;
					case 'MultiImage':
						collectionFields[field.slug] = Property.Array({
							displayName: field.displayName,
							required: !optionalFields && field.isRequired,
							description:
								' Images must be hosted on a publicly accessible URL to be uploaded via the API.The maximum file size for images is 4MB.',
						});
						break;
					case 'MultiReference':
						collectionFields[field.slug] = Property.Array({
							displayName: field.displayName,
							required: !optionalFields && field.isRequired,
						});
						break;
					case 'Number':
						collectionFields[field.slug] = Property.Number({
							displayName: field.displayName,
							required: !optionalFields && field.isRequired,
						});
						break;
					case 'DateTime':
						collectionFields[field.slug] = Property.DateTime({
							displayName: field.displayName,
							required: !optionalFields && field.isRequired,
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

			let offset = 0;
			let response: WebflowCollectionItemsPage;
			do {
				response = await webflowClient.request<WebflowCollectionItemsPage>({
					auth,
					method: HttpMethod.GET,
					path: `/v2/collections/${encodeURIComponent(String(collection_id))}/items`,
					query: { offset: String(offset), limit: String(PAGE_SIZE) },
				});
				offset += PAGE_SIZE;

				for (const item of response.items) {
					options.push({ label: item.fieldData.name ?? item.id, value: item.id });
				}
			} while (response.items.length > 0 && offset < Math.min(response.pagination.total, MAX_OPTIONS));

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

			let offset = 0;
			let response: WebflowOrdersPage;
			do {
				response = await webflowClient.request<WebflowOrdersPage>({
					auth,
					method: HttpMethod.GET,
					path: `/v2/sites/${encodeURIComponent(String(site_id))}/orders`,
					query: { offset: String(offset), limit: String(PAGE_SIZE) },
				});
				offset += PAGE_SIZE;

				for (const order of response.orders) {
					options.push({ label: order.orderId, value: order.orderId });
				}
			} while (response.orders.length > 0 && offset < Math.min(response.pagination.total, MAX_OPTIONS));

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

const PAGE_SIZE = 100;
const MAX_OPTIONS = 2000;

export type PropParams<R extends boolean> = { required: R; displayName?: string; description?: string };
