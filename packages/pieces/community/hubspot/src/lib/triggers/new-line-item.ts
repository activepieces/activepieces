import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { hubspotPolling } from '../common/polling';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	createTrigger,
	Property,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { Client } from '@hubspot/api-client';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

type Props = {
	additionalPropertiesToRetrieve?: string | string[];
};

import { crmObjectOutputSchema } from '../output-schemas';
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
			timestampProperty: 'createdate',
			lastFetchEpochMS,
			properties: propertiesToRetrieve,
		});
	},
} satisfies Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>, Props>;

export const newLineItemTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-line-item',
	classification: 'READ',
	displayName: 'New Line Item',
	description: 'Triggers when a new line item is created.',
	aiMetadata: {
		description:
			'Fires when a new line item is created in HubSpot. Each event represents one line item with properties such as name, price, quantity, amount, discount, tax, SKU, and linked product. Polls for line items by creation date; does not fire on updates to existing line items.',
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
		createdAt: '2024-12-25T11:08:54.763Z',
		archived: false,
		id: '26882583648',
		properties: {
			amount: '5.00',
			createdate: '2024-12-25T11:08:54.763Z',
			description: 'CHAIR',
			discount: '10',
			hs_cost_of_goods_sold: '10',
			hs_discount_percentage: null,
			hs_images: null,
			hs_lastmodifieddate: '2024-12-25T11:10:02.750Z',
			hs_line_item_currency_code: null,
			hs_object_id: '26882583648',
			hs_product_id: '17602013482',
			hs_sku: 'fb-100',
			hs_term_in_months: null,
			hs_url: null,
			name: 'Chair',
			price: '15.0',
			quantity: null,
			tax: null,
		},
		updatedAt: '2024-12-25T11:10:02.750Z',
	},
});
