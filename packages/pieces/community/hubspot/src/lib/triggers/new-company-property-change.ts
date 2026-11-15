import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { hubspotPolling } from '../common/polling';
import {
	createTrigger,
	AppConnectionValueForAuthProperty,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import { Client } from '@hubspot/api-client';
import { crmObjectOutputSchema } from '../output-schemas';

type Props = {
	propertyName?: string | string[];
};

const polling = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS, store }) {
		const client = new Client({ accessToken: getHubspotAccessToken(auth), numberOfApiCallRetries: 3 });
		const propertyToCheck = propsValue.propertyName as string;
		const propertiesToRetrieve = [...getDefaultPropertiesForObject(OBJECT_TYPE.COMPANY), propertyToCheck];

		return hubspotPolling.pollPropertyChanges({
			search: (request) => client.crm.companies.searchApi.doSearch(request),
			readWithHistory: (request) => client.crm.companies.batchApi.read(request),
			store,
			timestampProperty: 'hs_lastmodifieddate',
			watchedProperty: propertyToCheck,
			properties: propertiesToRetrieve,
			lastFetchEpochMS,
		});
	},
} satisfies Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>, Props>;

export const newCompanyPropertyChangeTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-company-property-change',
	classification: 'READ',
	displayName: 'New Company Property Change',
	description: 'Triggers when a specified property is updated on a company.',
	aiMetadata: {
		description:
			'Fires when the value of a chosen property changes on a HubSpot company. Polls the CRM companies API for companies modified since the last check, then inspects each company\'s property history to confirm the selected property was actually updated, emitting the company with its default properties and the watched property only when that property\'s most recent change is newer than the last poll. Clearing the watched property also fires. Represents a tracked field (e.g. lifecycle stage, domain, name) being modified on an existing company.',
	},
	props: {
		propertyName: standardObjectPropertiesDropdown(
			{
				objectType: OBJECT_TYPE.COMPANY,
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
