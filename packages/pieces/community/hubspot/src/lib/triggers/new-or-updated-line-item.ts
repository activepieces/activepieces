import { MarkdownVariant } from '@activepieces/pieces-framework';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { hubspotPolling } from '../common/polling';
import {
	createTrigger,
	Property,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { Client } from '@hubspot/api-client';

import { crmObjectOutputSchema } from '../output-schemas';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
const polling = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS, store }) {
		const client = new Client({ accessToken: getHubspotAccessToken(auth), numberOfApiCallRetries: 3 });

		// Extract properties once to avoid recomputation
		const additionalProperties = propsValue.additionalPropertiesToRetrieve ?? [];
		const defaultLineItemProperties = getDefaultPropertiesForObject(OBJECT_TYPE.LINE_ITEM);
		const propertiesToRetrieve = [...defaultLineItemProperties, ...additionalProperties];

		return hubspotPolling.pollSearchTrigger({
			store,
			search: (request) => client.crm.lineItems.searchApi.doSearch(request),
			timestampProperty: 'hs_lastmodifieddate',
			lastFetchEpochMS,
			properties: propertiesToRetrieve,
		});
	},
} satisfies Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>,{ additionalPropertiesToRetrieve?: string[] | string }>;

export const newOrUpdatedLineItemTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-or-updated-line-item',
	classification: 'READ',
	displayName: 'New or Updated Line Item',
	description: 'Triggers when a line item is created or updated.',
	aiMetadata: {
		description:
			'Fires when a line item is created or modified in HubSpot. Each event represents one line item with properties such as name, price, quantity, amount, discount, tax, SKU, and linked product. Polls by last-modified date, so both new and edited line items trigger it.',
	},
	props: {
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `Returned by default: name, description, price, quantity, amount, discount, tax, createdate, hs_object_id, hs_product_id, hs_images, hs_lastmodifieddate, hs_line_item_currency_code, hs_sku, hs_url, hs_cost_of_goods_sold, hs_discount_percentage, hs_term_in_months.

Pick more below.`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.LINE_ITEM,
			displayName: 'Additional Properties to Retrieve',
			required: false,
		}),
	},
	outputSchema: crmObjectOutputSchema,
	type: TriggerStrategy.POLLING,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, context);
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, context);
	},
	async test(context) {
		return hubspotPolling.sampleOldestToNewest({ items: await pollingHelper.test(polling, context) });
	},
	async run(context) {
		return await hubspotPolling.poll({ polling, context });
	},
	sampleData: {
		createdAt: '2024-12-24T16:17:34.281Z',
		archived: false,
		id: '26854130802',
		properties: {
			amount: '15.00',
			createdate: '2024-12-24T16:17:34.281Z',
			description: 'Chair',
			discount: null,
			hs_cost_of_goods_sold: '10',
			hs_discount_percentage: null,
			hs_images: null,
			hs_lastmodifieddate: '2024-12-24T16:17:50.488Z',
			hs_line_item_currency_code: 'USD',
			hs_object_id: '26854130802',
			hs_product_id: '17602013482',
			hs_sku: 'ch-100',
			hs_term_in_months: null,
			hs_url: null,
			name: 'Chair',
			price: '15.0',
			quantity: '1',
			tax: null,
		},
		updatedAt: '2024-12-24T16:17:50.488Z',
	},
});
