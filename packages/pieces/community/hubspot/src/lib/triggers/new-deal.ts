import { Property, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { hubspotPolling } from '../common/polling';
import { MarkdownVariant } from '@activepieces/pieces-framework';
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

		const additionalProperties = propsValue.additionalPropertiesToRetrieve ?? [];
		const defaultProductProperties = getDefaultPropertiesForObject(OBJECT_TYPE.DEAL);
		const propertiesToRetrieve = [...defaultProductProperties, ...additionalProperties];

		return hubspotPolling.pollSearchTrigger({
			store,
			search: (request) => client.crm.deals.searchApi.doSearch(request),
			timestampProperty: 'createdate',
			lastFetchEpochMS,
			properties: propertiesToRetrieve,
		});
	},
} satisfies Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>, Props>;

export const newDealTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-deal',
	classification: 'READ',
	displayName: 'New Deal',
	description: 'Triggers when a new deal is created.',
	aiMetadata: {
		description:
			'Fires when a new deal is created in HubSpot. Each event represents one deal record with properties such as deal name, type, amount, close date, owner, forecast, and associated contacts. Polls for deals by creation date; does not fire on updates to existing deals.',
	},
	props: {
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `Returned by default: dealtype, dealname, amount, description, closedate, createdate, num_associated_contacts, hs_forecast_amount, hs_forecast_probability, hs_manual_forecast_category, hs_next_step, hs_object_id, hs_lastmodifieddate, hubspot_owner_id, hubspot_team_id.

Pick more below.`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.DEAL,
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
