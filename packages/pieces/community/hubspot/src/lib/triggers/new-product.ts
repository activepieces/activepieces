import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { hubspotPolling } from '../common/polling';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	createTrigger,
	Property,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
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

		// Extract properties once to avoid recomputation
		const additionalProperties = propsValue.additionalPropertiesToRetrieve ?? [];
		const defaultProductProperties = getDefaultPropertiesForObject(OBJECT_TYPE.PRODUCT);
		const propertiesToRetrieve = [...defaultProductProperties, ...additionalProperties];

		return hubspotPolling.pollSearchTrigger({
			store,
			search: (request) => client.crm.products.searchApi.doSearch(request),
			timestampProperty: 'createdate',
			lastFetchEpochMS,
			properties: propertiesToRetrieve,
		});
	},
} satisfies Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>, Props>;

export const newProductTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-product',
	classification: 'READ',
	displayName: 'New Product',
	description: 'Triggers when a new product is created.',
	aiMetadata: {
		description:
			'Fires when a new product is created in the HubSpot product library. Each event represents one product record with properties such as name, description, price, and tax. Polls for products by creation date; does not fire on updates to existing products.',
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
		createdAt: '2024-12-22T10:43:01.920Z',
		archived: false,
		id: '17727139749',
		properties: {
			createdate: '2024-12-22T10:43:01.920Z',
			description: null,
			hs_lastmodifieddate: '2024-12-23T08:13:30.506Z',
			hs_object_id: '17727139749',
			name: 'TEST',
			price: '20.0',
			tax: null,
		},
		updatedAt: '2024-12-23T08:13:30.506Z',
	},
});
