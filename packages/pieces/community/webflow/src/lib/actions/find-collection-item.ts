import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../auth';
import { webflowClient } from '../common/client';
import { webflowProps } from '../common/props';
import type { WebflowCollectionItemsPage } from '../common/types';
import { findCollectionItemOutputSchema } from '../output-schemas';

export const findCollectionItemAction = createAction({
	auth: webflowAuth,
	name: 'find_collection_item',
	outputSchema: findCollectionItemOutputSchema,
	classification: 'SEARCH',
	description: 'Find collection item in a collection by field',
	displayName: 'Find a Collection Item by Field',
	audience: 'human',
	aiMetadata: { description: 'Searches a Webflow CMS collection for items whose given field name exactly matches the supplied value, optionally capped by a max-results limit. Use to look up an item by a known field value (e.g. slug or name) before reading or updating it. Read-only and idempotent. Note: matching is an exact equality filter applied client-side over the fetched items, not a fuzzy or paginated server search.', idempotent: true },
	props: {
		site_id: webflowProps.siteId({ required: true }),
		collection_id: webflowProps.collectionId({ required: true }),
		field_name: Property.ShortText({
			displayName: 'Field Name',
			description: 'The name of the field to search by',
			required: true,
		}),
		field_value: Property.ShortText({
			displayName: 'Field Value',
			description: 'The value of the field to search for',
			required: true,
		}),
		max_results: Property.Number({
			displayName: 'Max Results',
			description: 'The maximum number of results to return',
			required: false,
		}),
	},

	async run(configValue) {
		const collectionId = configValue.propsValue['collection_id'];
		const fieldName = configValue.propsValue['field_name'];
		const fieldValue = configValue.propsValue['field_value'];
		const maxResults = configValue.propsValue['max_results'];

		try {
			const res = await webflowClient.request<WebflowCollectionItemsPage>({
				auth: configValue.auth,
				method: HttpMethod.GET,
				path: `/v2/collections/${encodeURIComponent(collectionId)}/items`,
			});

			const items = res.items;
			const matches = items
				.filter((item) => {
					return item.fieldData[fieldName] === fieldValue;
				})
				.slice(0, maxResults);

			return { success: true, result: matches };
		} catch (err) {
			return { success: false, message: err };
		}
	},
});
