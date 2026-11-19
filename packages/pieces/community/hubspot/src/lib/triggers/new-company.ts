import {Property, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import { OBJECT_TYPE } from '../common/constants';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { hubspotPolling } from '../common/polling';
import { Client } from '@hubspot/api-client';

import { crmObjectOutputSchema } from '../output-schemas';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';


type Props = {
	additionalPropertiesToRetrieve?: string | string[];
};

const polling = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS, store }) {
		const client = new Client({ accessToken: getHubspotAccessToken(auth), numberOfApiCallRetries: 3 });

		const additionalProperties = propsValue.additionalPropertiesToRetrieve ?? [];
		const defaultCompanyProperties = getDefaultPropertiesForObject(OBJECT_TYPE.COMPANY);
		const propertiesToRetrieve = [...defaultCompanyProperties, ...additionalProperties];

		return hubspotPolling.pollSearchTrigger({
			store,
			search: (request) => client.crm.companies.searchApi.doSearch(request),
			timestampProperty: 'createdate',
			lastFetchEpochMS,
			properties: propertiesToRetrieve,
		});
	},
} satisfies Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>, Props>;
export const newCompanyTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-company',
	classification: 'READ',
	displayName: 'New Company',
	description: 'Triggers when a new company is created.',
	aiMetadata: {
		description:
			'Fires when a new company is created in HubSpot. Each event represents one company record with properties such as name, domain, industry, address, employee count, revenue, and lifecycle stage. Polls for companies by creation date; does not fire on updates to existing companies.',
	},
	props: {
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `Returned by default: name, domain, industry, about_us, phone, address, address2, city, state, zip, country, website, type, description, founded_year, hs_createdate, hs_lastmodifieddate, hs_object_id, is_public, timezone, total_money_raised, total_revenue, owneremail, ownername, numberofemployees, annualrevenue, lifecyclestage, createdate, web_technologies.

Pick more below.`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.COMPANY,
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
