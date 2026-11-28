import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { hubspotPolling } from '../common/polling';
import {
	createTrigger,
	DynamicPropsValue,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
	customObjectDropdown,
	customObjectPropertiesDropdown,
} from '../common/props';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import { Client } from '@hubspot/api-client';
import { crmObjectOutputSchema } from '../output-schemas';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

type Props = {
	customObjectType?: string;
	propertyName?: DynamicPropsValue;
};

const polling = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS, store }) {
		const client = new Client({ accessToken: getHubspotAccessToken(auth), numberOfApiCallRetries: 3 });
		const customObjectType = propsValue.customObjectType as string;
		const propertyToCheck = propsValue.propertyName?.['values'] as string;
		const propertiesToRetrieve = [propertyToCheck];

		return hubspotPolling.pollPropertyChanges({
			search: (request) => client.crm.objects.searchApi.doSearch(customObjectType, request),
			readWithHistory: (request) => client.crm.objects.batchApi.read(customObjectType, request),
			store,
			timestampProperty: 'hs_lastmodifieddate',
			watchedProperty: propertyToCheck,
			properties: propertiesToRetrieve,
			lastFetchEpochMS,
		});
	},
} satisfies Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>, Props>;

export const newCustomObjectPropertyChangeTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-custom-object-property-change',
	classification: 'READ',
	displayName: 'New Custom Object Property Change',
	description: 'Triggers when a specified property is updated on a custom object.',
	aiMetadata: {
		description:
			'Fires when the chosen property changes on a record of the selected HubSpot custom object type. Each event represents one custom-object record whose selected property was modified since the last poll, returning the record with the watched property. Clearing the watched property also fires. Use to react to specific field updates on a custom object rather than every change.',
	},
	propertyGroups: [
		{
			key: 'watch',
			display: 'section',
			label: 'Property to Watch',
			icon: 'filter',
			props: ['customObjectType', 'propertyName'],
		},
	],
	props: {
		customObjectType: customObjectDropdown,
		propertyName: customObjectPropertiesDropdown({
			displayName: 'Property',
			required: true,
			isSingleSelect: true,
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
