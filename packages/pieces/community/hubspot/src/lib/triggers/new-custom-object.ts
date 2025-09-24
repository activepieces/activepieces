import { hubspotAuth } from '../../';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	createTrigger,
	DynamicPropsValue,
	PiecePropValueSchema,
	Property,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { customObjectDropdown, customObjectPropertiesDropdown } from '../common/props';
import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '../common/types';
import dayjs from 'dayjs';

type Props = {
	customObjectType?: string;
	additionalPropertiesToRetrieve?: DynamicPropsValue;
};

const polling: Polling<PiecePropValueSchema<typeof hubspotAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const client = new Client({ accessToken: auth.access_token, numberOfApiCallRetries: 3 });

		const customObjectType = propsValue.customObjectType as string;
		const additionalPropertiesToRetrieve = propsValue.additionalPropertiesToRetrieve?.['values'];

		let propertiesToRetrieve;
		try {
			if (Array.isArray(additionalPropertiesToRetrieve)) {
				propertiesToRetrieve = additionalPropertiesToRetrieve;
			}
			if (typeof additionalPropertiesToRetrieve === 'string') {
				propertiesToRetrieve = JSON.parse(additionalPropertiesToRetrieve as string);
			}
		} catch (error) {
			propertiesToRetrieve = [];
		}

		const items = [];
		let after;

		do {
			const isTest = lastFetchEpochMS === 0;
			const response = await client.crm.objects.searchApi.doSearch(customObjectType, {
				limit: isTest ? 10 : 100,
				after,
				properties: propertiesToRetrieve,
				sorts: ['-hs_createdate'],
				filterGroups: isTest
					? []
					: [
							{
								filters: [
									{
										propertyName: 'hs_createdate',
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
			epochMilliSeconds: dayjs(item.properties['hs_createdate']).valueOf(),
			data: item,
		}));
	},
};

export const newCustomObjectTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-custom-object',
	displayName: 'New Custom Object',
	description: 'Triggers when new custom object is available.',
	props: {
		customObjectType: customObjectDropdown,
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `### Properties to retrieve:
                                                    
                    hs_object_id, hs_lastmodifieddate, hs_createdate   
                        
                    **Specify here a list of additional properties to retrieve**`,
		}),
		additionalPropertiesToRetrieve: customObjectPropertiesDropdown(
			'Additional Properties to Retrieve',
			false,
		),
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
		createdAt: '2024-12-22T15:20:16.121Z',
		archived: false,
		id: '21583829313',
		properties: {
			hs_createdate: '2024-12-22T15:20:16.121Z',
			hs_lastmodifieddate: '2024-12-22T15:20:16.818Z',
			hs_object_id: '21583829313',
			pet_name: 'Oreo',
		},
		updatedAt: '2024-12-22T15:20:16.818Z',
	},
});
