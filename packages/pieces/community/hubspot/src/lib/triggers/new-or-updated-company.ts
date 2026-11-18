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
		const defaultCompanyProperties = getDefaultPropertiesForObject(OBJECT_TYPE.COMPANY);
		const propertiesToRetrieve = [...defaultCompanyProperties, ...additionalProperties];

		return hubspotPolling.pollSearchTrigger({
			store,
			search: (request) => client.crm.companies.searchApi.doSearch(request),
			timestampProperty: 'hs_lastmodifieddate',
			lastFetchEpochMS,
			properties: propertiesToRetrieve,
		});
	},
} satisfies Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>,{ additionalPropertiesToRetrieve?: string[] | string }>;

export const newOrUpdatedCompanyTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-or-updated-company',
	classification: 'READ',
	displayName: 'New or Updated Company',
	description: 'Triggers when a company is created or updated.',
	aiMetadata: {
		description:
			'Fires when a company is created or modified in HubSpot. Each event represents one company record with properties such as name, domain, industry, address, employee count, revenue, and lifecycle stage. Polls by last-modified date, so both new and edited companies trigger it.',
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
		createdAt: '2024-12-20T10:08:20.243Z',
		archived: false,
		id: '27508860336',
		properties: {
			about_us: 'Automation',
			address: null,
			address2: null,
			annualrevenue: '500000',
			city: null,
			country: null,
			createdate: '2024-12-20T10:08:20.243Z',
			description: 'Automation',
			domain: 'www.activepieces.com',
			founded_year: null,
			hs_createdate: null,
			hs_lastmodifieddate: '2024-12-25T10:04:47.382Z',
			hs_object_id: '27508860336',
			industry: 'COMPUTER_SOFTWARE',
			is_public: null,
			lifecyclestage: 'lead',
			name: 'Activepieces',
			numberofemployees: '6',
			owneremail: null,
			ownername: null,
			phone: null,
			state: null,
			timezone: null,
			total_money_raised: null,
			total_revenue: null,
			type: 'OTHER',
			web_technologies: null,
			website: 'www.activepieces.com',
			zip: null,
		},
		updatedAt: '2024-12-25T10:04:47.382Z',
	},
});
