import { MarkdownVariant } from '@activepieces/shared';
import { hubspotAuth } from '../../';
import {
	createTrigger,
	PiecePropValueSchema,
	Property,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '../common/types';
import dayjs from 'dayjs';

const polling: Polling<
	PiecePropValueSchema<typeof hubspotAuth>,
	{ additionalPropertiesToRetrieve?: string[] | string }
> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const client = new Client({ accessToken: auth.access_token, numberOfApiCallRetries: 3 });

		// Extract properties once to avoid recomputation
		const additionalProperties = propsValue.additionalPropertiesToRetrieve ?? [];
		const defaultLineItemProperties = getDefaultPropertiesForObject(OBJECT_TYPE.LINE_ITEM);
		const propertiesToRetrieve = [...defaultLineItemProperties, ...additionalProperties];

		const items = [];
		let after;

		do {
			const isTest = lastFetchEpochMS === 0;
			const response = await client.crm.lineItems.searchApi.doSearch({
				limit: isTest ? 10 : 100,
				after,
				properties: propertiesToRetrieve,
				sorts: ['-hs_lastmodifieddate'],
				filterGroups: isTest
					? []
					: [
							{
								filters: [
									{
										propertyName: 'hs_lastmodifieddate',
										operator: FilterOperatorEnum.Gt,
										value: lastFetchEpochMS.toString(),
									},
								],
							},
					  ],
			});
			after = response.paging?.next?.after;
			items.push(...response.results);

			// Stop fetching if it's a test
			if (isTest) break;
		} while (after);

		return items.map((item) => ({
			epochMilliSeconds: dayjs(item.properties['hs_lastmodifieddate']).valueOf(),
			data: item,
		}));
	},
};

export const newOrUpdatedLineItemTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-or-updated-line-item',
	displayName: 'Line Item Recently Created or Updated',
	description: 'Triggers when a line item recently created or updated.',
	props: {
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `### Properties to retrieve:
                                    
                    name, description, price, quantity, amount, discount, tax, createdate, hs_object_id, hs_product_id, hs_images, hs_lastmodifieddate, hs_line_item_currency_code, hs_sku, hs_url, hs_cost_of_goods_sold, hs_discount_percentage, hs_term_in_months           
                                    
                    **Specify here a list of additional properties to retrieve**`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.LINE_ITEM,
			displayName: 'Additional properties to retrieve',
			required: false,
		}),
	},
	type: TriggerStrategy.POLLING,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
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
