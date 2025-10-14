import { hubspotAuth } from '../..';
import {
	createTrigger,
	DynamicPropsValue,
	PiecePropValueSchema,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
	customObjectDropdown,
	customObjectPropertiesDropdown,
	standardObjectPropertiesDropdown,
} from '../common/props';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { chunk } from '@activepieces/shared';

import { Client } from '@hubspot/api-client';
import dayjs from 'dayjs';
import { FilterOperatorEnum } from '../common/types';

type Props = {
	customObjectType?: string;
	propertyName?: DynamicPropsValue;
};

const polling: Polling<PiecePropValueSchema<typeof hubspotAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const client = new Client({ accessToken: auth.access_token, numberOfApiCallRetries: 3 });

		const customObjectType = propsValue.customObjectType as string;
		const propertyToCheck = propsValue.propertyName?.['values'] as string;

		const propertiesToRetrieve = [propertyToCheck];

		const items = [];
		// For test, we only fetch 10 custom objects
		if (lastFetchEpochMS === 0) {
			const response = await client.crm.objects.searchApi.doSearch(customObjectType, {
				limit: 10,
				properties: propertiesToRetrieve,
				sorts: ['-hs_lastmodifieddate'],
			});
			items.push(...response.results);
			return items.map((item) => ({
				epochMilliSeconds: dayjs(item.properties['hs_lastmodifieddate']).valueOf(),
				data: item,
			}));
		}
		//fetch updated custom objects
		const updatedCustomObjects = [];
		let after;
		do {
			const response = await client.crm.objects.searchApi.doSearch(customObjectType, {
				limit: 100,
				after,
				sorts: ['-hs_lastmodifieddate'],
				filterGroups: [
					{
						filters: [
							{
								propertyName: propertyToCheck,
								operator: FilterOperatorEnum.HasProperty,
							},
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
			updatedCustomObjects.push(...response.results);
		} while (after);

		if (updatedCustomObjects.length === 0) {
			return [];
		}

    // Avoid VALIDATION_ERROR: The maximum number of inputs supported in a batch request for property histories is 50
    const batchApiChunks = chunk(updatedCustomObjects, 50);

    // Fetch custom objects with property history
    const batchApiResps = await Promise.all(
      batchApiChunks.map((batch) => {
        return client.crm.objects.batchApi.read(customObjectType, {
          propertiesWithHistory: [propertyToCheck],
          properties: propertiesToRetrieve,
          inputs: batch.map((customObject) => {
            return {
              id: customObject.id,
            };
          }),
        });
      })
    );

    const updatedCustomObjectsWithPropertyHistory = batchApiResps.flatMap(
      (resp) => resp.results
    );

		for (const customObject of updatedCustomObjectsWithPropertyHistory) {
			const history = customObject.propertiesWithHistory?.[propertyToCheck];
			if (!history || history.length === 0) {
				continue;
			}
			const propertyLastModifiedDateTimeStamp = dayjs(history[0].timestamp).valueOf();
			if (propertyLastModifiedDateTimeStamp > lastFetchEpochMS) {
				const { propertiesWithHistory, ...item } = customObject;
				items.push(item);
			}
		}

		return items.map((item) => ({
			epochMilliSeconds: dayjs(item.properties['hs_lastmodifieddate']).valueOf(),
			data: item,
		}));
	},
};

export const newCustomObjectPropertyChangeTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-custom-object-property-change',
	displayName: 'New Custom Object Property Change',
	description: 'Triggers when a specified property is updated on a custom object.',
	props: {
		customObjectType: customObjectDropdown,
		propertyName: customObjectPropertiesDropdown('Property Name', true, true),
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
