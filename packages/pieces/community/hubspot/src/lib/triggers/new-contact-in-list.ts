import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { hubspotAuth } from '../../';
import {
	createTrigger,
	DropdownOption,
	PiecePropValueSchema,
	Property,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { Client } from '@hubspot/api-client';
import { MarkdownVariant } from '@activepieces/shared';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import dayjs from 'dayjs';

type Props = {
	listId: string;
	additionalPropertiesToRetrieve?: string | string[];
};

const polling: Polling<PiecePropValueSchema<typeof hubspotAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const listId = propsValue.listId;

		const additionalProperties = propsValue.additionalPropertiesToRetrieve ?? [];
		const defaultContactProperties = getDefaultPropertiesForObject(OBJECT_TYPE.CONTACT);
		const propertiesToRetrieve = [...defaultContactProperties, ...additionalProperties];

		const client = new Client({ accessToken: auth.access_token });
		const isTestMode = lastFetchEpochMS === 0;

		let listMembers = [];
		let after;

		// Fetch members from the list
		do {
			const response = await client.crm.lists.membershipsApi.getPageOrderedByAddedToListDate(
				listId,
				after,
				undefined,
				isTestMode ? 10 : 100,
			);
			after = response.paging?.next?.after;
			listMembers.push(...response.results);
			if (isTestMode) {
				break;
			}
		} while (after);

		if (!isTestMode) {
			listMembers = listMembers.filter(
				(member) => dayjs(member.membershipTimestamp).valueOf() > lastFetchEpochMS,
			);
		}

		// Fetch detailed contact properties
		const contactDetailsResponse = await client.crm.contacts.batchApi.read({
			inputs: listMembers.map((member) => ({ id: member.recordId })),
			properties: propertiesToRetrieve,
			propertiesWithHistory: [],
		});

		// Merge `membershipTimestamp` with contact properties
		const enrichedMembers = contactDetailsResponse.results.map((contact) => {
			const correspondingMember = listMembers.find((member) => member.recordId === contact.id);
			return {
				...contact,
				membershipTimestamp: correspondingMember?.membershipTimestamp,
			};
		});

		return enrichedMembers.map((member) => ({
			epochMilliSeconds: dayjs(member.membershipTimestamp).valueOf(),
			data: member,
		}));
	},
};

export const newContactInListTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-contact-in-list',
	displayName: 'New Contact in List',
	description: 'Triggers when a new contact is added to the specified list.',
	type: TriggerStrategy.POLLING,
	props: {
		listId: Property.Dropdown({
			displayName: 'Contact List',
			refreshers: [],
			required: true,
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please connect your account.',
					};
				}

				const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;
				const client = new Client({ accessToken: authValue.access_token });
				let offset = 0;
				let hasMore = true;
				const options: DropdownOption<string>[] = [];
				do {
					const response = await client.crm.lists.listsApi.doSearch({
						count: 100,
						offset: offset,
					});
					for (const list of response.lists) {
						options.push({
							label: list.name,
							value: list.listId,
						});
					}
					hasMore = response.hasMore;
					offset += 100;
				} while (hasMore);

				return {
					disabled: false,
					options,
				};
			},
		}),
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
		id: '123',
		archived: false,
		createdAt: '2023-06-13T10:24:42.392Z',
		updatedAt: '2023-06-30T06:16:51.869Z',
		properties: {
			email: 'contact@email.com',
			lastname: 'Last',
			firstname: 'First',
			createdate: '2023-06-13T10:24:42.392Z',
			hs_object_id: '123',
			lastmodifieddate: '2023-06-30T06:16:51.869Z',
		},
	},
});
