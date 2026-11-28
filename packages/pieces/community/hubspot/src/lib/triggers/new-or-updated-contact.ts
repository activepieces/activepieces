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
		const defaultContactProperties = getDefaultPropertiesForObject(OBJECT_TYPE.CONTACT);
		const propertiesToRetrieve = [...defaultContactProperties, ...additionalProperties];

		return hubspotPolling.pollSearchTrigger({
			store,
			search: (request) => client.crm.contacts.searchApi.doSearch(request),
			timestampProperty: 'lastmodifieddate',
			lastFetchEpochMS,
			properties: propertiesToRetrieve,
		});
	},
} satisfies Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>,{ additionalPropertiesToRetrieve?: string[] | string }>;

export const newOrUpdatedContactTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-or-updated-contact',
	classification: 'READ',
	displayName: 'New or Updated Contact',
	description: 'Triggers when a contact is created or updated.',
	aiMetadata: {
		description:
			'Fires when a contact is created or modified in HubSpot. Each event represents one contact record with properties such as name, email, company, phone, lifecycle stage, and address. Polls by last-modified date, so both new and edited contacts trigger it.',
	},
	props: {
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `Returned by default: firstname, lastname, email, company, website, mobilephone, phone, fax, address, city, state, zip, salutation, country, jobtitle, hs_createdate, hs_email_domain, hs_object_id, lastmodifieddate, hs_persona, hs_language, lifecyclestage, createdate, numemployees, annualrevenue, industry.

Pick more below.`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.CONTACT,
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
		createdAt: '2024-12-06T10:52:58.322Z',
		archived: false,
		id: '82665997707',
		properties: {
			address: null,
			annualrevenue: null,
			city: 'Brisbane',
			company: 'HubSpot',
			country: null,
			createdate: '2024-12-06T10:52:58.322Z',
			email: 'emailmaria@hubspot.com',
			fax: null,
			firstname: 'Maria',
			hs_createdate: null,
			hs_email_domain: 'hubspot.com',
			hs_language: null,
			hs_object_id: '82665997707',
			hs_persona: null,
			industry: null,
			jobtitle: 'Salesperson',
			lastmodifieddate: '2024-12-20T12:50:35.201Z',
			lastname: 'Johnson (Sample Contact)',
			lifecyclestage: 'lead',
			mobilephone: null,
			numemployees: null,
			phone: null,
			salutation: null,
			state: null,
			website: 'http://www.HubSpot.com',
			zip: null,
		},
		updatedAt: '2024-12-20T12:50:35.201Z',
	},
});
