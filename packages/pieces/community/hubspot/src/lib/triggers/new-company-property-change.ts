import { hubspotAuth } from '../..';
import {
	createTrigger,
	PiecePropValueSchema,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { chunk } from '@activepieces/shared';

import { Client } from '@hubspot/api-client';
import dayjs from 'dayjs';
import { FilterOperatorEnum } from '../common/types';

type Props = {
	propertyName?: string | string[];
};

const polling: Polling<PiecePropValueSchema<typeof hubspotAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const client = new Client({ accessToken: auth.access_token });

		const propertyToCheck = propsValue.propertyName as string;

		const propertiesToRetrieve = [propertyToCheck];

		const items = [];
		// For test, we only fetch 10 comapnies
		if (lastFetchEpochMS === 0) {
			const response = await client.crm.companies.searchApi.doSearch({
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
		//fetch updated companies
		const updatedCompanies = [];
		let after;
		do {
			const response = await client.crm.companies.searchApi.doSearch({
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
			updatedCompanies.push(...response.results);
		} while (after);

		if (updatedCompanies.length === 0) {
			return [];
		}

    // Avoid VALIDATION_ERROR: The maximum number of inputs supported in a batch request for property histories is 50
    const batchApiChunks = chunk(updatedCompanies, 50);

    // Fetch companies with property history
    const batchApiResps = await Promise.all(
      batchApiChunks.map((batch) => {
        return client.crm.companies.batchApi.read({
          propertiesWithHistory: [propertyToCheck],
          properties: propertiesToRetrieve,
          inputs: batch.map((company) => {
            return {
              id: company.id,
            };
          }),
        });
      })
    );

    const updatedCompaniesWithPropertyHistory = batchApiResps.flatMap(
      (resp) => resp.results
    );

		for (const company of updatedCompaniesWithPropertyHistory) {
			const history = company.propertiesWithHistory?.[propertyToCheck];
			if (!history || history.length === 0) {
				continue;
			}
			const propertyLastModifiedDateTimeStamp = dayjs(history[0].timestamp).valueOf();
			if (propertyLastModifiedDateTimeStamp > lastFetchEpochMS) {
				const { propertiesWithHistory, ...item } = company;
				items.push(item);
			}
		}

		return items.map((item) => ({
			epochMilliSeconds: dayjs(item.properties['hs_lastmodifieddate']).valueOf(),
			data: item,
		}));
	},
};

export const newCompanyPropertyChangeTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-company-property-change',
	displayName: 'New Company Property Change',
	description: 'Triggers when a specified property is updated on a company.',
	props: {
		propertyName: standardObjectPropertiesDropdown(
			{
				objectType: OBJECT_TYPE.COMPANY,
				displayName: 'Property Name',
				required: true,
			},
			true,
			true,
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
		id: '27656515180',
		properties: {
			createdate: '2024-12-26T08:36:10.463Z',
			domain: 'www.activepieces.com',
			hs_lastmodifieddate: '2024-12-26T08:58:48.657Z',
			hs_object_id: '27656515180',
			name: 'Activepieces',
		},
		createdAt: '2024-12-26T08:36:10.463Z',
		updatedAt: '2024-12-26T08:58:48.657Z',
		archived: false,
	},
});
