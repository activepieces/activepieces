import { afterEach, describe, expect, test, vi } from 'vitest';
import { createTicketAction } from '../src/lib/actions/create-ticket';
import { updateTicketAction } from '../src/lib/actions/update-ticket';
import { createTicketByTypeIdAction } from '../src/lib/actions/ai/create-ticket-by-type-id';
import { updateTicketByIdAction } from '../src/lib/actions/ai/update-ticket-by-id';
import { toTicketAttributes, TicketTypeAttribute } from '../src/lib/common/ticket-attributes';
import { ME, runAction, stubIntercom } from './helpers';

const ATTRIBUTES: TicketTypeAttribute[] = [
	{ name: '_default_title_', data_type: 'string', required_to_create: false },
	{ name: '_default_description_', data_type: 'string' },
	{ name: 'Priority', data_type: 'list', input_options: { list_options: [{ id: '2', label: 'High' }] } },
	{ name: 'Due', data_type: 'datetime' },
	{ name: 'Seats', data_type: 'integer' },
	{ name: 'Budget', data_type: 'decimal' },
	{ name: 'Urgent', data_type: 'boolean' },
	{ name: 'Order Ref', data_type: 'string', required_to_create: true },
];

const TICKET_TYPE = { type: 'ticket_type', id: '85', name: 'AP Test', ticket_type_attributes: { type: 'list', data: ATTRIBUTES } };
const TICKET = { type: 'ticket', id: '500', ticket_id: '7', ticket_type: { id: '85', name: 'AP Test' }, ticket_attributes: {} };

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('toTicketAttributes', () => {
	test('keeps text and list values that dayjs could parse as dates', () => {
		const result = toTicketAttributes({
			attributes: ATTRIBUTES,
			values: { _default_title_: 'Order 2024', _default_description_: 'Ticket 5', Priority: '2', 'Order Ref': '123' },
		});
		expect(result).toEqual({ _default_title_: 'Order 2024', _default_description_: 'Ticket 5', Priority: '2', 'Order Ref': '123' });
	});

	test('converts only datetime attributes to unix seconds', () => {
		const result = toTicketAttributes({
			attributes: ATTRIBUTES,
			values: { Due: '2026-10-20T12:00:00.000Z', _default_title_: '2026-10-20' },
		});
		expect(result).toEqual({ Due: 1792497600, _default_title_: '2026-10-20' });
	});

	test('accepts unix seconds and milliseconds for datetime', () => {
		expect(toTicketAttributes({ attributes: ATTRIBUTES, values: { Due: 1792497600 } })).toEqual({ Due: 1792497600 });
		expect(toTicketAttributes({ attributes: ATTRIBUTES, values: { Due: 1792497600000 } })).toEqual({ Due: 1792497600 });
		expect(toTicketAttributes({ attributes: ATTRIBUTES, values: { Due: '1792497600' } })).toEqual({ Due: 1792497600 });
	});

	test('types numbers and booleans and keeps null to clear', () => {
		expect(
			toTicketAttributes({ attributes: ATTRIBUTES, values: { Seats: '12', Budget: '9.5', Urgent: 'true', Priority: null } }),
		).toEqual({ Seats: 12, Budget: 9.5, Urgent: true, Priority: null });
	});

	test('rejects values that do not fit the attribute type', () => {
		expect(() => toTicketAttributes({ attributes: ATTRIBUTES, values: { Due: 'next week-ish' } })).toThrow('expects a date');
		expect(() => toTicketAttributes({ attributes: ATTRIBUTES, values: { Seats: '1.5' } })).toThrow('whole number');
		expect(() => toTicketAttributes({ attributes: ATTRIBUTES, values: { Urgent: 'yes' } })).toThrow('true or false');
	});

	test('passes unknown attributes through unchanged', () => {
		expect(toTicketAttributes({ attributes: ATTRIBUTES, values: { Other: '2' } })).toEqual({ Other: '2' });
	});
});

describe('Create Ticket (existing, human)', () => {
	test('sends titles with numbers and list option IDs unchanged (P1-1)', async () => {
		const seen = stubIntercom([
			{ method: 'GET', path: '/ticket_types/85', reply: { body: TICKET_TYPE } },
			{ method: 'POST', path: '/tickets', reply: { body: TICKET } },
		]);
		const output = await runAction({
			action: createTicketAction,
			props: {
				ticketTypeId: '85',
				contactId: 'c1',
				ticketProperties: { _default_title_: 'Order 2024', Priority: '2', Due: '2026-10-20T12:00:00.000Z' },
			},
		});
		expect(output).toEqual(TICKET);
		const post = seen.find((r) => r.method === 'POST');
		expect(post?.body).toEqual({
			ticket_type_id: '85',
			contacts: [{ id: 'c1' }],
			ticket_attributes: { _default_title_: 'Order 2024', Priority: '2', Due: 1792497600 },
		});
		expect(post?.headers.get('intercom-version')).toBe('2.11');
	});
});

describe('Update Ticket (existing, human)', () => {
	test('PUTs only given fields and keeps list values as option IDs', async () => {
		const seen = stubIntercom([
			{ method: 'GET', path: '/ticket_types/85', reply: { body: TICKET_TYPE } },
			{ method: 'GET', path: '/me', reply: { body: ME } },
			{ method: 'PUT', path: '/tickets/500', reply: { body: TICKET } },
		]);
		await runAction({
			action: updateTicketAction,
			props: { ticketTypeId: '85', ticketId: '500', ticketProperties: { Priority: '2' }, state: 'resolved', assignedAdminId: '42' },
		});
		const put = seen.find((r) => r.method === 'PUT');
		expect(put?.body).toEqual({
			state: 'resolved',
			assignment: { assignee_id: '42', admin_id: '991' },
			ticket_attributes: { Priority: '2' },
		});
	});
});

describe('Create Ticket (by Type ID)', () => {
	test('maps title and description, contact by email, and checks required attributes', async () => {
		const seen = stubIntercom([
			{ method: 'GET', path: '/ticket_types/85', reply: { body: TICKET_TYPE } },
			{ method: 'POST', path: '/tickets', reply: { body: TICKET } },
		]);
		await runAction({
			action: createTicketByTypeIdAction,
			props: {
				ticketTypeId: '85',
				contactLookupBy: 'email',
				contactValue: 'ap-test@example.com',
				title: 'Ticket 5',
				attributes: { 'Order Ref': '2024', _default_title_: 'ignored', Seats: '3' },
			},
		});
		expect(seen.find((r) => r.method === 'POST')?.body).toEqual({
			ticket_type_id: '85',
			contacts: [{ email: 'ap-test@example.com' }],
			ticket_attributes: { 'Order Ref': '2024', _default_title_: 'Ticket 5', Seats: 3 },
		});
	});

	test('refuses before posting when a required attribute is missing', async () => {
		const seen = stubIntercom([{ method: 'GET', path: '/ticket_types/85', reply: { body: TICKET_TYPE } }]);
		await expect(
			runAction({
				action: createTicketByTypeIdAction,
				props: { ticketTypeId: '85', contactLookupBy: 'id', contactValue: 'c1', title: 'x' },
			}),
		).rejects.toThrow('requires: Order Ref');
		expect(seen.some((r) => r.method === 'POST')).toBe(false);
	});
});

describe('Update Ticket (by ID)', () => {
	test('refuses an empty update without calling Intercom', async () => {
		const seen = stubIntercom([]);
		await expect(runAction({ action: updateTicketByIdAction, props: { ticketId: '500' } })).rejects.toThrow('Nothing to update');
		expect(seen).toHaveLength(0);
	});

	test('reads the ticket type to type attributes and maps open/shared', async () => {
		const seen = stubIntercom([
			{ method: 'GET', path: '/tickets/500', reply: { body: TICKET } },
			{ method: 'GET', path: '/ticket_types/85', reply: { body: TICKET_TYPE } },
			{ method: 'PUT', path: '/tickets/500', reply: { body: TICKET } },
		]);
		await runAction({
			action: updateTicketByIdAction,
			props: { ticketId: '500', open: 'closed', isShared: 'shared', attributes: { Due: '2026-10-20T12:00:00Z', Priority: null } },
		});
		expect(seen.find((r) => r.method === 'PUT')?.body).toEqual({
			open: false,
			is_shared: true,
			ticket_attributes: { Due: 1792497600, Priority: null },
		});
	});
});
