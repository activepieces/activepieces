import { PiecePropValueSchema, Property, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import dayjs from 'dayjs';
import { MarkdownVariant } from '@activepieces/shared';
import { OBJECT_TYPE } from '../common/constants';
import { hubspotAuth } from '../..';
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
		const defaultCompanyProperties = getDefaultPropertiesForObject(OBJECT_TYPE.COMPANY);
		const propertiesToRetrieve = [...defaultCompanyProperties, ...additionalProperties];

		const items = [];
		let after;

		do {
			const isTest = lastFetchEpochMS === 0;
			const response = await client.crm.companies.searchApi.doSearch({
				limit: isTest ? 10 : 100,
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
export const newCompanyTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-company',
	displayName: 'New Company',
	description: 'Trigger when a new company is added.',
	props: {
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `### Properties to retrieve:
                                
                  name, domain, industry, about_us, phone, address, address2, city, state, zip, country, website, type, description, founded_year, hs_createdate, hs_lastmodifieddate, hs_object_id, is_public, timezone, total_money_raised, total_revenue, owneremail, ownername, numberofemployees, annualrevenue, lifecyclestage, createdate, web_technologies
                                
                  **Specify here a list of additional properties to retrieve**`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.COMPANY,
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
		id: '123123123',
		archived: false,
		createdAt: '2023-07-03T14:48:13.839Z',
		updatedAt: '2023-07-03T14:48:14.769Z',
		properties: {
			name: 'Company Name',
			domain: 'company.com',
			createdate: '2023-07-03T14:48:13.839Z',
			hs_object_id: '123123123',
			hs_lastmodifieddate: '2023-07-03T14:48:14.769Z',
		},
	},
});
