import { PiecePropValueSchema, Property, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import dayjs from 'dayjs';
import { hubspotAuth } from '../..';
import { MarkdownVariant } from '@activepieces/shared';
import { OBJECT_TYPE } from '../common/constants';
import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '../common/types';

type Props = {
	additionalPropertiesToRetrieve?: string | string[];
};

const polling: Polling<PiecePropValueSchema<typeof hubspotAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const client = new Client({ accessToken: auth.access_token, numberOfApiCallRetries: 3 });

		const additionalProperties = propsValue.additionalPropertiesToRetrieve ?? [];
		const defaultProductProperties = getDefaultPropertiesForObject(OBJECT_TYPE.DEAL);
		const propertiesToRetrieve = [...defaultProductProperties, ...additionalProperties];

		const items = [];
		let after;

		do {
			const isTest = lastFetchEpochMS === 0;
			const response = await client.crm.deals.searchApi.doSearch({
				limit: isTest ? 10 : 100,
				after,
				properties: propertiesToRetrieve,
				sorts: ['-createdate'],
				filterGroups: isTest
					? []
					: [
							{
								filters: [
									{
										propertyName: 'createdate',
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
			epochMilliSeconds: dayjs(item.properties['createdate']).valueOf(),
			data: item,
		}));
	},
};

export const newDealTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-deal',
	displayName: 'New Deal',
	description: 'Trigger when a new deal is added.',
	props: {
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `### Properties to retrieve:
                                                        
					dealtype, dealname, amount, description, closedate, createdate, num_associated_contacts, hs_forecast_amount, hs_forecast_probability, hs_manual_forecast_category, hs_next_step, hs_object_id, hs_lastmodifieddate, hubspot_owner_id, hubspot_team_id
                            
                    **Specify here a list of additional properties to retrieve**`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.DEAL,
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
		createdAt: '2024-12-23T08:19:21.614Z',
		archived: false,
		id: '30906615140',
		properties: {
			amount: '150',
			closedate: null,
			createdate: '2024-12-23T08:19:21.614Z',
			dealname: 'test deal',
			dealtype: 'newbusiness',
			description: 'test',
			hs_forecast_amount: '150.0',
			hs_forecast_probability: null,
			hs_lastmodifieddate: '2024-12-26T10:31:45.624Z',
			hs_manual_forecast_category: null,
			hs_next_step: null,
			hs_object_id: '30906615140',
			hubspot_owner_id: '64914635',
			hubspot_team_id: '55094099',
			num_associated_contacts: '1',
		},
		updatedAt: '2024-12-26T10:31:45.624Z',
	},
});
