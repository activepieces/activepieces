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
import { crmObjectOutputSchema } from '../output-schemas';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

type Props = {
	propertyName?: string | string[];
};

const polling = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS, store }) {
		const client = new Client({ accessToken: getHubspotAccessToken(auth), numberOfApiCallRetries: 3 });
		const propertyToCheck = propsValue.propertyName as string;
		const propertiesToRetrieve = [...getDefaultPropertiesForObject(OBJECT_TYPE.CONTACT), propertyToCheck];

		return hubspotPolling.pollPropertyChanges({
			search: (request) => client.crm.contacts.searchApi.doSearch(request),
			readWithHistory: (request) => client.crm.contacts.batchApi.read(request),
			store,
			timestampProperty: 'lastmodifieddate',
			watchedProperty: propertyToCheck,
			properties: propertiesToRetrieve,
			lastFetchEpochMS,
		});
	},
} satisfies Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>, Props>;

export const newContactPropertyChangeTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-contact-property-change',
	classification: 'READ',
	displayName: 'New Contact Property Change',
	description: 'Triggers when a specified property is updated on a contact.',
	aiMetadata: {
		description:
			'Fires when the chosen property changes on any HubSpot contact. Each event represents one contact whose selected property was modified since the last poll, returning the contact with its default properties and the watched property. Clearing the watched property also fires. Use to react to specific field updates (e.g. lifecycle stage, lead status) rather than every contact change.',
	},
	props: {
		propertyName: standardObjectPropertiesDropdown(
			{
				objectType: OBJECT_TYPE.CONTACT,
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
