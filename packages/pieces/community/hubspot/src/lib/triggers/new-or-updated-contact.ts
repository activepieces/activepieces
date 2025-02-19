import { MarkdownVariant } from '@activepieces/shared';
import { hubspotAuth } from '../../';
import {
	createTrigger,
	PiecePropValueSchema,
	Property,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '../common/types';
import dayjs from 'dayjs';

const polling: Polling<
	PiecePropValueSchema<typeof hubspotAuth>,
	{ additionalPropertiesToRetrieve?: string[] | string }
> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const client = new Client({ accessToken: auth.access_token });

		// Extract properties once to avoid recomputation
		const additionalProperties = propsValue.additionalPropertiesToRetrieve ?? [];
		const defaultContactProperties = getDefaultPropertiesForObject(OBJECT_TYPE.CONTACT);
		const propertiesToRetrieve = [...defaultContactProperties, ...additionalProperties];

		const items = [];
		let after;

		do {
			const isTest = lastFetchEpochMS === 0;
			const response = await client.crm.contacts.searchApi.doSearch({
				limit: isTest ? 10 : 100,
				after,
				properties: propertiesToRetrieve,
				sorts: ['-lastmodifieddate'],
				filterGroups: isTest
					? []
					: [
							{
								filters: [
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
			items.push(...response.results);

			// Stop fetching if it's a test
			if (isTest) break;
		} while (after);

		return items.map((item) => ({
			epochMilliSeconds: dayjs(item.properties['lastmodifieddate']).valueOf(),
			data: item,
		}));
	},
};

export const newOrUpdatedContactTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-or-updated-contact',
	displayName: 'Contact Recently Created or Updated',
	description: 'Triggers when a contact recenty created or updated.',
	props: {
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `### Properties to retrieve:
                                    
                    firstname, lastname, email, company, website, mobilephone, phone, fax, address, city, state, zip, salutation, country, jobtitle, hs_createdate, hs_email_domain, hs_object_id, lastmodifieddate, hs_persona, hs_language, lifecyclestage, createdate, numemployees, annualrevenue, industry			
                                    
                    **Specify here a list of additional properties to retrieve**`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.CONTACT,
			displayName: 'Additional properties to retrieve',
			required: false,
		}),
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
