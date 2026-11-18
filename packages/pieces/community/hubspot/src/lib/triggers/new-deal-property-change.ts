import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { hubspotPolling } from '../common/polling';
import {
	createTrigger,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import { Client } from '@hubspot/api-client';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

type Props = {
	propertyName?: string | string[];
};

import { crmObjectOutputSchema } from '../output-schemas';
const polling = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS, store }) {
		const client = new Client({ accessToken: getHubspotAccessToken(auth), numberOfApiCallRetries: 3 });
		const propertyToCheck = propsValue.propertyName as string;
		const propertiesToRetrieve = [...getDefaultPropertiesForObject(OBJECT_TYPE.DEAL), propertyToCheck];

		return hubspotPolling.pollPropertyChanges({
			search: (request) => client.crm.deals.searchApi.doSearch(request),
			readWithHistory: (request) => client.crm.deals.batchApi.read(request),
			store,
			timestampProperty: 'hs_lastmodifieddate',
			watchedProperty: propertyToCheck,
			properties: propertiesToRetrieve,
			lastFetchEpochMS,
		});
	},
} satisfies Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>, Props>;

export const newDealPropertyChangeTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-deal-property-change',
	classification: 'READ',
	displayName: 'New Deal Property Change',
	description: 'Triggers when a specified property is updated on a deal.',
	aiMetadata: {
		description:
			'Fires when the value of a chosen property changes on a HubSpot deal. Polls the CRM deals API for deals modified since the last check, then inspects each deal\'s property history to confirm the selected property was actually updated, emitting the deal with its default properties and the watched property only when that property\'s most recent change is newer than the last poll. Clearing the watched property also fires. Represents a tracked field (e.g. deal stage, amount, close date) being modified on an existing deal.',
	},
	props: {
		propertyName: standardObjectPropertiesDropdown(
			{
				objectType: OBJECT_TYPE.DEAL,
				displayName: 'Property',
				required: true,
			},
			true,
			true,
		),
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
			createdate: '2024-12-23T08:19:21.614Z',
			hs_lastmodifieddate: '2024-12-26T09:30:44.578Z',
			hs_object_id: '30906615140',
		},
		updatedAt: '2024-12-26T09:30:44.578Z',
	},
});
