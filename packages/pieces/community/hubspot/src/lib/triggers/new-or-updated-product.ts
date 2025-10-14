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
		const defaultProductProperties = getDefaultPropertiesForObject(OBJECT_TYPE.PRODUCT);
		const propertiesToRetrieve = [...defaultProductProperties, ...additionalProperties];

		const items = [];
		let after;

		do {
			const isTest = lastFetchEpochMS === 0;
			const response = await client.crm.products.searchApi.doSearch({
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

export const newOrUpdatedProductTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-or-updated-product',
	displayName: 'Product Recently Created or Updated',
	description: 'Triggers when a product recently created or updated.',
	props: {
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `### Properties to retrieve:
                                    
                    createdate, description, name, price, tax, hs_lastmodifieddate
                                    
                    **Specify here a list of additional properties to retrieve**`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.PRODUCT,
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
		createdAt: '2024-12-18T16:10:27.710Z',
		archived: false,
		id: '17602013482',
		properties: {
			createdate: '2024-12-18T16:10:27.710Z',
			description: 'Chair',
			hs_lastmodifieddate: '2024-12-23T08:13:30.314Z',
			hs_object_id: '17602013482',
			name: 'Chair',
			price: '15.0',
			tax: null,
		},
		updatedAt: '2024-12-23T08:13:30.314Z',
	},
});
