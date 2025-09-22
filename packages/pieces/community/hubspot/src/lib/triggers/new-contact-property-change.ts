import { hubspotAuth } from '../..';
import {
	createTrigger,
	PiecePropValueSchema,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { chunk } from '@activepieces/shared';

import { Client } from '@hubspot/api-client';
import dayjs from 'dayjs';
import { FilterOperatorEnum } from '../common/types';

type Props = {
	propertyName?: string | string[];
};

const polling: Polling<PiecePropValueSchema<typeof hubspotAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const client = new Client({ accessToken: auth.access_token });

		const propertyToCheck = propsValue.propertyName as string;

		// Extract properties once to avoid recomputation
		const propertiesToRetrieve = [propertyToCheck];

		const items = [];
		// For test, we only fetch 10 contacts
		if (lastFetchEpochMS === 0) {
			const response = await client.crm.contacts.searchApi.doSearch({
				limit: 10,
				properties: propertiesToRetrieve,
				sorts: ['-lastmodifieddate'],
			});
			items.push(...response.results);
			return items.map((item) => ({
				epochMilliSeconds: dayjs(item.properties['lastmodifieddate']).valueOf(),
				data: item,
			}));
		}
		//fetch updated contacts
		const updatedContacts = [];
		let after;
		do {
			const response = await client.crm.contacts.searchApi.doSearch({
				limit: 100,
				after,
				sorts: ['-lastmodifieddate'],
				filterGroups: [
					{
						filters: [
							{
								propertyName: propertyToCheck,
								operator: FilterOperatorEnum.HasProperty,
							},
							{
								propertyName: 'lastmodifieddate',
								operator: FilterOperatorEnum.Gt,
								value: lastFetchEpochMS.toString(),
							},
						],
					},
				],
			});
			after = response.paging?.next?.after;
			updatedContacts.push(...response.results);
		} while (after);

		if (updatedContacts.length === 0) {
			return [];
		}

		// Avoid VALIDATION_ERROR: The maximum number of inputs supported in a batch request for property histories is 50
    const batchApiChunks = chunk(updatedContacts, 50);

    // Fetch contacts with property history
    const batchApiResps = await Promise.all(
      batchApiChunks.map((batch) => {
        return client.crm.contacts.batchApi.read({
          propertiesWithHistory: [propertyToCheck],
          properties: propertiesToRetrieve,
          inputs: batch.map((contact) => {
            return {
              id: contact.id,
            };
          }),
        });
      })
    );

    const updatedContcatsWithPropertyHistory = batchApiResps.flatMap(
      (resp) => resp.results
    );

		for (const contact of updatedContcatsWithPropertyHistory) {
			const history = contact.propertiesWithHistory?.[propertyToCheck];
			if (!history || history.length === 0) {
				continue;
			}
			const propertyLastModifiedDateTimeStamp = dayjs(history[0].timestamp).valueOf();
			if (propertyLastModifiedDateTimeStamp > lastFetchEpochMS) {
				const { propertiesWithHistory, ...item } = contact;
				items.push(item);
			}
		}

		return items.map((item) => ({
			epochMilliSeconds: dayjs(item.properties['lastmodifieddate']).valueOf(),
			data: item,
		}));
	},
};

export const newContactPropertyChangeTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-contact-property-change',
	displayName: 'New Contact Property Change',
	description: 'Triggers when a specified property is updated on a contact.',
	props: {
		propertyName: standardObjectPropertiesDropdown(
			{
				objectType: OBJECT_TYPE.CONTACT,
				displayName: 'Property Name',
				required: true,
			},
			true,
			true,
		),
	},
	type: TriggerStrategy.POLLING,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
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
