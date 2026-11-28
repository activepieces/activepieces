import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { hubspotPolling } from '../common/polling';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	createTrigger,
	DynamicPropsValue,
	Property,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import { customObjectDropdown, customObjectPropertiesDropdown } from '../common/props';
import { Client } from '@hubspot/api-client';
import { crmObjectOutputSchema } from '../output-schemas';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

type Props = {
	customObjectType?: string;
	additionalPropertiesToRetrieve?: DynamicPropsValue;
};

const polling = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS, store }) {
		const client = new Client({ accessToken: getHubspotAccessToken(auth), numberOfApiCallRetries: 3 });

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

		return hubspotPolling.pollSearchTrigger({
			store,
			search: (request) => client.crm.objects.searchApi.doSearch(customObjectType, request),
			timestampProperty: 'hs_createdate',
			lastFetchEpochMS,
			properties: propertiesToRetrieve,
		});
	},
} satisfies Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>, Props>;

export const newCustomObjectTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-custom-object',
	classification: 'READ',
	displayName: 'New Custom Object',
	description: 'Triggers when a new custom object record is created.',
	aiMetadata: {
		description:
			'Fires when a new record of the selected HubSpot custom object type is created. Each event represents one custom-object record with the properties chosen to retrieve plus standard fields like object ID and create date. Polls by creation date; does not fire on updates to existing records.',
	},
	propertyGroups: [
		{
			key: 'object',
			display: 'section',
			label: 'Object Type',
			icon: 'tag',
			props: ['customObjectType'],
		},
	],
	props: {
		customObjectType: customObjectDropdown,
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `Returned by default: hs_object_id, hs_lastmodifieddate, hs_createdate.

Pick more under **Advanced**.`,
		}),
		additionalPropertiesToRetrieve: customObjectPropertiesDropdown({
			displayName: 'Additional Properties to Retrieve',
			required: false,
			advanced: true,
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
