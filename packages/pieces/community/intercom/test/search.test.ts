import { afterEach, describe, expect, test, vi } from 'vitest';
import { searchContactsAction } from '../src/lib/actions/search-contacts';
import { searchConversationsAction } from '../src/lib/actions/search-conversations';
import { searchTicketsAction } from '../src/lib/actions/search-tickets';
import { findConversationAction } from '../src/lib/actions/find-conversation';
import { getContactAction } from '../src/lib/actions/get-contact';
import { updateContactAction } from '../src/lib/actions/update-contact';
import { listContactNotesAction } from '../src/lib/actions/list-contact-notes';
import { buildSearchQuery } from '../src/lib/common/lookups';
import { runAction, stubIntercom } from './helpers';

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('Search Contacts', () => {
	test('combines filters with AND, uses > and < on dates, and returns a cursor list', async () => {
		const seen = stubIntercom([
			{
				method: 'POST',
				path: '/contacts/search',
				reply: {
					body: { type: 'list', data: [{ id: 'c1' }], total_count: 7, pages: { next: { starting_after: 'CUR2' } } },
				},
			},
		]);
		const output = await runAction({
			action: searchContactsAction,
			props: {
				email: ' ann@example.com ',
				role: 'lead',
				updatedAfter: '2026-10-01T00:00:00Z',
				customAttribute: 'plan',
				customValue: 'pro',
				perPage: 20,
				startingAfter: 'CUR1',
			},
		});
		expect(seen[0].body).toEqual({
			query: {
				operator: 'AND',
				value: [
					{ field: 'email', operator: '=', value: 'ann@example.com' },
					{ field: 'role', operator: '=', value: 'lead' },
					{ field: 'updated_at', operator: '>', value: 1790812800 },
					{ field: 'custom_attributes.plan', operator: '=', value: 'pro' },
				],
			},
			pagination: { per_page: 20, starting_after: 'CUR1' },
		});
		expect(output).toEqual({ items: [{ id: 'c1' }], total_count: 7, has_more: true, next_starting_after: 'CUR2' });
	});

	test('no filters searches all users and leads; last page has has_more=false', async () => {
		const seen = stubIntercom([{ method: 'POST', path: '/contacts/search', reply: { body: { data: [], total_count: 0, pages: {} } } }]);
		const output = await runAction({ action: searchContactsAction, props: {} });
		expect(seen[0].body).toEqual({
			query: { field: 'role', operator: 'IN', value: ['user', 'lead'] },
			pagination: { per_page: 50 },
		});
		expect(output).toEqual({ items: [], total_count: 0, has_more: false, next_starting_after: null });
	});

	test('rejects bad page size and half-given custom attribute before calling Intercom', async () => {
		const seen = stubIntercom([]);
		await expect(runAction({ action: searchContactsAction, props: { perPage: 500 } })).rejects.toThrow('1 to 150');
		await expect(runAction({ action: searchContactsAction, props: { customAttribute: 'plan' } })).rejects.toThrow('Custom Attribute Value');
		await expect(runAction({ action: searchContactsAction, props: { advancedQuery: ['x'] } })).rejects.toThrow('Advanced Query');
		expect(seen).toHaveLength(0);
	});
});

describe('Search Conversations / Tickets', () => {
	test('conversation filters map to Intercom fields and read the conversations key', async () => {
		const seen = stubIntercom([
			{ method: 'POST', path: '/conversations/search', reply: { body: { conversations: [{ id: '9' }], total_count: 1, pages: {} } } },
		]);
		const output = await runAction({
			action: searchConversationsAction,
			props: { state: 'snoozed', contactId: 'c1', bodyContains: 'refund', createdBefore: '2026-10-02T00:00:00Z' },
		});
		expect(seen[0].body).toEqual({
			query: {
				operator: 'AND',
				value: [
					{ field: 'state', operator: '=', value: 'snoozed' },
					{ field: 'contact_ids', operator: '=', value: 'c1' },
					{ field: 'source.body', operator: '~', value: 'refund' },
					{ field: 'created_at', operator: '<', value: 1790899200 },
				],
			},
			pagination: { per_page: 50 },
		});
		expect(output).toEqual({ items: [{ id: '9' }], total_count: 1, has_more: false, next_starting_after: null });
	});

	test('ticket search maps open to a boolean and title to ~', async () => {
		const seen = stubIntercom([{ method: 'POST', path: '/tickets/search', reply: { body: { tickets: [], total_count: 0 } } }]);
		await runAction({ action: searchTicketsAction, props: { open: 'closed', titleContains: 'login', ticketTypeId: '85' } });
		expect(seen[0].body).toEqual({
			query: {
				operator: 'AND',
				value: [
					{ field: 'ticket_type_id', operator: '=', value: '85' },
					{ field: 'open', operator: '=', value: false },
					{ field: 'title', operator: '~', value: 'login' },
				],
			},
			pagination: { per_page: 50 },
		});
	});

	test('more than 15 filters are refused', () => {
		const filters = Array.from({ length: 16 }, (_, index) => ({ field: `custom_attributes.a${index}`, operator: '=', value: 'x' }));
		expect(() => buildSearchQuery({ filters, advancedQuery: undefined, fallback: filters[0] })).toThrow('at most 15 filters');
		expect(buildSearchQuery({ filters: filters.slice(0, 15), advancedQuery: undefined, fallback: filters[0] })).toMatchObject({
			operator: 'AND',
		});
	});
});

describe('Find Conversation (existing)', () => {
	test('ID fields only allow Equals (P2-10) and nothing is sent', async () => {
		const seen = stubIntercom([]);
		await expect(
			runAction({ action: findConversationAction, props: { searchField: 'tag_ids', matchType: 'contains', searchTerm: '12' } }),
		).rejects.toThrow('only be matched with Equals');
		expect(seen).toHaveLength(0);
	});

	test('snoozed status is accepted', async () => {
		const seen = stubIntercom([{ method: 'POST', path: '/conversations/search', reply: { body: { conversations: [{ id: '1' }], pages: {} } } }]);
		const output = await runAction({
			action: findConversationAction,
			props: { searchField: 'source.subject', matchType: 'contains', searchTerm: 'refund', status: 'snoozed' },
		});
		expect(output).toEqual({ found: true, conversation: { id: '1' } });
		expect(seen[0].body).toMatchObject({
			query: {
				operator: 'AND',
				value: [
					{ field: 'source.subject', operator: '~', value: 'refund' },
					{ field: 'state', operator: '=', value: 'snoozed' },
				],
			},
		});
	});
});

describe('Contacts', () => {
	test('Get Contact by email fails when the email is shared', async () => {
		stubIntercom([{ method: 'POST', path: '/contacts/search', reply: { body: { data: [{ id: 'a' }, { id: 'b' }] } } }]);
		await expect(runAction({ action: getContactAction, props: { lookupBy: 'email', value: 'x@y.z' } })).rejects.toThrow(
			'More than one Intercom contact',
		);
	});

	test('Update Contact sends only set fields and nulls for Clear Fields', async () => {
		const seen = stubIntercom([{ method: 'PUT', path: '/contacts/c1', reply: { body: { id: 'c1' } } }]);
		await runAction({
			action: updateContactAction,
			props: { contactId: 'c1', name: 'Ann', unsubscribed: 'unsubscribed', clearFields: ['phone', 'owner_id'] },
		});
		expect(seen[0].body).toEqual({ name: 'Ann', unsubscribed_from_emails: true, phone: null, owner_id: null });
	});

	test('Update Contact refuses an empty update and a set+clear conflict', async () => {
		const seen = stubIntercom([]);
		await expect(runAction({ action: updateContactAction, props: { contactId: 'c1' } })).rejects.toThrow('Nothing to update');
		await expect(
			runAction({ action: updateContactAction, props: { contactId: 'c1', name: 'A', clearFields: ['name'] } }),
		).rejects.toThrow('Do not set and clear');
		expect(seen).toHaveLength(0);
	});

	test('List Contact Notes returns page info', async () => {
		stubIntercom([
			{
				method: 'GET',
				path: '/contacts/c1/notes',
				reply: { body: { data: [{ id: 'n1' }], total_count: 3, pages: { page: 1, total_pages: 2 } } },
			},
		]);
		expect(await runAction({ action: listContactNotesAction, props: { contactId: 'c1' } })).toEqual({
			items: [{ id: 'n1' }],
			total_count: 3,
			has_more: true,
			next_page: 2,
		});
	});
});
