import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { getHubspotAccessToken, HubspotAuthValue, hubspotAuth } from '../auth';
import {
	createTrigger,
	DropdownOption,
	isNil,
	Property,
	Store,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { Client } from '@hubspot/api-client';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { hubspotPolling, PollDeadline } from '../common/polling';
import { newContactInListTriggerOutputSchema } from '../output-schemas';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

type Props = {
	listId: string;
	additionalPropertiesToRetrieve?: string | string[];
};

const polling: Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS, store }) {
		const listId = propsValue.listId;

		const additionalProperties = propsValue.additionalPropertiesToRetrieve ?? [];
		const defaultContactProperties = getDefaultPropertiesForObject(OBJECT_TYPE.CONTACT);
		const propertiesToRetrieve = [...defaultContactProperties, ...additionalProperties];

		const client = new Client({ accessToken: getHubspotAccessToken(auth), numberOfApiCallRetries: 3 });
		const isTestMode = lastFetchEpochMS === 0;
		const contactDeadline = hubspotPolling.createPollDeadline(isTestMode ? TEST_BUDGET_MS : CONTACT_READ_BUDGET_MS);
		const members = isTestMode
			? await fetchNewestMembers({ client, listId })
			: await fetchMembersJoinedSince({ client, listId, since: lastFetchEpochMS, store });

		const { contacts, processed } = await readContacts({
			client,
			members,
			properties: propertiesToRetrieve,
			deadline: contactDeadline,
		});
		const readable = processed < members.length ? dropTrailingTies(members.slice(0, processed)) : members;
		return readable.flatMap((member) => {
			const contact = contacts.get(member.recordId);
			if (!contact) {
				return [];
			}
			return [
				{
					epochMilliSeconds: member.joinedAt,
					data: { ...contact, membershipTimestamp: member.membershipTimestamp },
				},
			];
		});
	},
};

async function fetchMembershipPage({ client, listId, after }: { client: Client; listId: string; after?: string }) {
	const response = await client.crm.lists.membershipsApi.getPageOrderedByAddedToListDate(
		listId,
		after,
		undefined,
		MEMBERSHIP_PAGE_SIZE,
	);
	const members = response.results
		.map((member) => ({
			recordId: member.recordId,
			membershipTimestamp: member.membershipTimestamp,
			joinedAt: hubspotPolling.toEpoch(member.membershipTimestamp),
		}))
		.filter((member) => Number.isFinite(member.joinedAt));
	return { members, next: response.paging?.next?.after };
}

function detectOrder({ order, reference, members }: { order: JoinOrder; reference?: ListMember; members: ListMember[] }): JoinOrder {
	if (order !== 'unknown' || isNil(reference)) {
		return order;
	}
	if (members.some((member) => member.joinedAt < reference.joinedAt)) {
		return 'newest-first';
	}
	if (members.some((member) => member.joinedAt > reference.joinedAt)) {
		return 'oldest-first';
	}
	return 'unknown';
}

function byJoinTime({ a, b }: { a: ListMember; b: ListMember }): number {
	return a.joinedAt - b.joinedAt || a.recordId.localeCompare(b.recordId);
}

function dropTrailingTies(members: ListMember[]): ListMember[] {
	const last = members[members.length - 1];
	if (isNil(last)) {
		return members;
	}
	const kept = members.filter((member) => member.joinedAt < last.joinedAt);
	return kept.length > 0 ? kept : members;
}

async function fetchNewestMembers({ client, listId }: { client: Client; listId: string }): Promise<ListMember[]> {
	const deadline = hubspotPolling.createPollDeadline(TEST_BUDGET_MS);
	let page = await fetchMembershipPage({ client, listId });
	const reference = page.members[0];
	let order = detectOrder({ order: 'unknown', reference, members: page.members });
	let newest = page.members;
	while (order !== 'newest-first' && !isNil(page.next) && !deadline.reached()) {
		page = await fetchMembershipPage({ client, listId, after: page.next });
		order = detectOrder({ order, reference, members: page.members });
		newest = [...newest, ...page.members].sort((a, b) => byJoinTime({ a, b })).slice(-TEST_SAMPLE_SIZE);
	}
	return [...newest].sort((a, b) => byJoinTime({ a, b })).reverse().slice(0, TEST_SAMPLE_SIZE);
}

async function fetchMembersJoinedSince({
	client,
	listId,
	since,
	store,
}: {
	client: Client;
	listId: string;
	since: number;
	store: Store;
}): Promise<ListMember[]> {
	const saved = await store.get<ListCursor>(LIST_CURSOR_KEY);
	const resumable = saved?.listId === listId && saved.oldestFirst === true ? saved : undefined;
	const deadline = hubspotPolling.createPollDeadline(MEMBERSHIP_BUDGET_MS);

	let after: string | undefined;
	let page = await fetchMembershipPage({ client, listId });
	const reference = page.members[0];
	let order = detectOrder({ order: 'unknown', reference, members: page.members });
	const headHasFresh = page.members.some((member) => member.joinedAt > since);
	if (resumable && !isNil(resumable.after) && order !== 'newest-first' && !headHasFresh) {
		after = resumable.after;
		const resumed = await fetchResumePage({ client, listId, after });
		if (isNil(resumed)) {
			after = undefined;
		} else {
			page = resumed;
			order = 'oldest-first';
		}
	}

	let resumeFrom: string | undefined = order === 'oldest-first' ? after : undefined;
	let joined: ListMember[] = [];
	let reachedCheckpoint = false;
	for (;;) {
		const fresh = page.members.filter((member) => member.joinedAt > since);
		joined = [...joined, ...fresh];
		if (order === 'newest-first' && fresh.length < page.members.length) {
			reachedCheckpoint = true;
			break;
		}
		if (order === 'oldest-first' && fresh.length === 0) {
			resumeFrom = after;
		}
		if (isNil(page.next)) {
			reachedCheckpoint = true;
			break;
		}
		if (deadline.reached()) {
			break;
		}
		after = page.next;
		page = await fetchMembershipPage({ client, listId, after });
		order = detectOrder({ order, reference, members: page.members });
	}

	if (order === 'oldest-first') {
		await store.put<ListCursor>(LIST_CURSOR_KEY, { listId, after: resumeFrom, oldestFirst: true });
	} else {
		await store.delete(LIST_CURSOR_KEY);
	}
	const sorted = [...joined].sort((a, b) => byJoinTime({ a, b }));
	if (reachedCheckpoint) {
		return sorted;
	}
	console.warn(`[hubspot] list ${listId} membership read stopped at the poll deadline; the rest are read on the next poll`);
	return order === 'oldest-first' ? dropTrailingTies(sorted) : sorted;
}

async function fetchResumePage({ client, listId, after }: { client: Client; listId: string; after: string }) {
	try {
		return await fetchMembershipPage({ client, listId, after });
	} catch (error) {
		console.warn(`[hubspot] list ${listId} resume cursor was rejected; reading from the start`, error);
		return undefined;
	}
}

async function readContacts({
	client,
	members,
	properties,
	deadline,
}: {
	client: Client;
	members: ListMember[];
	properties: string[];
	deadline: PollDeadline;
}): Promise<{ contacts: Map<string, ContactRecord>; processed: number }> {
	const { results, processed } = await hubspotPolling.mapInBatches({
		items: members,
		batchSize: CONTACT_BATCH_SIZE,
		deadline,
		read: (batch) =>
			client.crm.contacts.batchApi.read({
				inputs: [...new Set(batch.map((member) => member.recordId))].map((id) => ({ id })),
				properties,
				propertiesWithHistory: [],
			}),
	});
	if (processed < members.length) {
		console.warn('[hubspot] contact reads stopped at the poll deadline; the rest are read on the next poll');
	}
	const contacts = new Map(results.flatMap((response) => response.results).map((contact) => [contact.id, contact]));
	return { contacts, processed };
}

export const newContactInListTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-contact-in-list',
	classification: 'READ',
	displayName: 'New Contact in List',
	description: 'Triggers when a new contact is added to the specified list.',
	aiMetadata: {
		description:
			'Fires when a contact is added to the selected HubSpot contact list. Each event represents one contact whose membership was added since the last poll, enriched with the contact record properties (name, email, etc.) plus the timestamp it joined the list. Tracked by list-membership date.',
	},
	outputSchema: newContactInListTriggerOutputSchema,
	type: TriggerStrategy.POLLING,
	propertyGroups: [
		{
			key: 'list',
			display: 'section',
			label: 'List',
			icon: 'users',
			props: ['listId'],
		},
	],
	props: {
		listId: Property.Dropdown({
			displayName: 'Contact List',
			auth: hubspotAuth,
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

				const authValue = auth as HubspotAuthValue;
				const client = new Client({ accessToken: getHubspotAccessToken(authValue) });
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
			value: `Returned by default: firstname, lastname, email, company, website, mobilephone, phone, fax, address, city, state, zip, salutation, country, jobtitle, hs_createdate, hs_email_domain, hs_object_id, lastmodifieddate, hs_persona, hs_language, lifecyclestage, createdate, numemployees, annualrevenue, industry.

Pick more under **Advanced**.`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.CONTACT,
			displayName: 'Additional Properties to Retrieve',
			required: false,
			advanced: true,
		}),
	},
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

const MEMBERSHIP_PAGE_SIZE = 250;
const CONTACT_BATCH_SIZE = 100;
const TEST_SAMPLE_SIZE = 5;
const TEST_BUDGET_MS = 20_000;
const CONTACT_READ_BUDGET_MS = 50_000;
const MEMBERSHIP_BUDGET_MS = 35_000;
const LIST_CURSOR_KEY = 'listMembershipCursor';

type ListMember = { recordId: string; membershipTimestamp: Date; joinedAt: number };

type ContactRecord = Awaited<ReturnType<Client['crm']['contacts']['batchApi']['read']>>['results'][number];

type ListCursor = { listId: string; after?: string; oldestFirst?: boolean };

type JoinOrder = 'unknown' | 'newest-first' | 'oldest-first';
