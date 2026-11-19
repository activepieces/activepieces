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
		const defaultProductProperties = getDefaultPropertiesForObject(OBJECT_TYPE.PRODUCT);
		const propertiesToRetrieve = [...defaultProductProperties, ...additionalProperties];

		return hubspotPolling.pollSearchTrigger({
			store,
			search: (request) => client.crm.products.searchApi.doSearch(request),
			timestampProperty: 'hs_lastmodifieddate',
			lastFetchEpochMS,
			properties: propertiesToRetrieve,
		});
	},
} satisfies Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>,{ additionalPropertiesToRetrieve?: string[] | string }>;

export const newOrUpdatedProductTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-or-updated-product',
	classification: 'READ',
	displayName: 'New or Updated Product',
	description: 'Triggers when a product is created or updated.',
	aiMetadata: {
		description:
			'Fires when a product is created or modified in the HubSpot product library. Each event represents one product record with properties such as name, description, price, and tax. Polls by last-modified date, so both new and edited products trigger it.',
	},
	props: {
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `Returned by default: createdate, description, name, price, tax, hs_lastmodifieddate.

Pick more below.`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.PRODUCT,
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
		createdAt: '2024-12-18T16:10:27.710Z',
		archived: false,
		id: '17602013482',
		properties: {
			createdate: '2024-12-18T16:10:27.710Z',
			description: 'Chair',
			hs_lastmodifieddate: '2024-12-23T08:13:30.314Z',
			hs_object_id: '17602013482',
			name: 'Chair',
			price: '15.0',
			tax: null,
		},
		updatedAt: '2024-12-23T08:13:30.314Z',
	},
});
