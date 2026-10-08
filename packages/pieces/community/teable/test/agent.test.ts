import { beforeEach, describe, expect, it, vi } from 'vitest';
import { teableAgent } from '../src/lib/common/agent';
import { TeableField } from '../src/lib/common/client';
import { upsertRecordAi } from '../src/lib/actions/upsert-record-ai';
import { createRecordAi } from '../src/lib/actions/create-record-ai';
import { updateRecordAi } from '../src/lib/actions/update-record-ai';
import { runAction } from './helpers';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
	return {
		...actual,
		httpClient: {
			sendRequest: (...args: unknown[]) => sendRequest(...args),
		},
	};
});

const FIELDS: TeableField[] = [
	{ id: 'fldName', name: 'Name', type: 'singleLineText', isPrimary: true },
	{ id: 'fldEmail', name: 'Email', type: 'singleLineText' },
	{ id: 'fldAge', name: 'Age', type: 'number' },
	{ id: 'fldStatus', name: 'Status', type: 'singleSelect', options: { choices: [{ id: 'c1', name: 'Open' }] } },
	{ id: 'fldTotal', name: 'Total', type: 'formula', isComputed: true },
];

const TABLES = [
	{ id: 'tblContacts', name: 'Contacts' },
	{ id: 'tblOrders', name: 'Orders' },
	{ id: 'tblDup1', name: 'Twice' },
	{ id: 'tblDup2', name: 'Twice' },
];

function calls(): { method: string; url: string; body?: unknown }[] {
	return sendRequest.mock.calls.map((c) => c[0]);
}

beforeEach(() => {
	sendRequest.mockReset();
});

describe('resolveTable via actions', () => {
	it('resolves a table by name case-insensitively', async () => {
		sendRequest.mockResolvedValueOnce({ body: TABLES });
		sendRequest.mockResolvedValueOnce({ body: FIELDS });
		sendRequest.mockResolvedValueOnce({
			body: { records: [{ id: 'rec1', fields: { fldName: 'Jane' } }] },
		});
		const output = await runAction({
			action: createRecordAi,
			propsValue: { baseId: 'bse1', table: 'contacts', fields: { Name: 'Jane' } },
		});
		expect(calls()[2].url).toContain('/api/table/tblContacts/record');
		expect(output).toMatchObject({ id: 'rec1', fields: { Name: 'Jane' } });
	});

	it('refuses an ambiguous table name and lists the IDs', async () => {
		sendRequest.mockResolvedValueOnce({ body: TABLES });
		await expect(
			runAction({
				action: createRecordAi,
				propsValue: { baseId: 'bse1', table: 'Twice', fields: { Name: 'x' } },
			})
		).rejects.toThrow(/2 tables are named "Twice" \(IDs: tblDup1, tblDup2\)/);
	});

	it('names the available tables when the reference does not match', async () => {
		sendRequest.mockResolvedValueOnce({ body: TABLES });
		await expect(
			runAction({
				action: createRecordAi,
				propsValue: { baseId: 'bse1', table: 'Nope', fields: { Name: 'x' } },
			})
		).rejects.toThrow(/Table "Nope" was not found in this base. Tables: Contacts \(tblContacts\)/);
	});
});

describe('buildRecordFields', () => {
	it('maps names case-insensitively and field IDs to field IDs', () => {
		const values = teableAgent.buildRecordFields({
			fields: FIELDS,
			input: { name: 'Jane', fldEmail: 'jane@example.com' },
			allowClear: false,
		});
		expect(values).toEqual({ fldName: 'Jane', fldEmail: 'jane@example.com' });
	});

	it('rejects unknown columns and lists valid names', () => {
		expect(() =>
			teableAgent.buildRecordFields({ fields: FIELDS, input: { Nope: 1 }, allowClear: false })
		).toThrow(/Column "Nope" does not exist in this table. Valid columns: Name, Email, Age, Status/);
	});

	it('rejects computed columns', () => {
		expect(() =>
			teableAgent.buildRecordFields({ fields: FIELDS, input: { Total: 1 }, allowClear: false })
		).toThrow(/Column "Total" \(formula\) cannot be written/);
	});

	it('rejects the same column given twice', () => {
		expect(() =>
			teableAgent.buildRecordFields({
				fields: FIELDS,
				input: { Name: 'a', fldName: 'b' },
				allowClear: false,
			})
		).toThrow(/Column "Name" is given more than once/);
	});

	it('skips nulls on create but sends them on update (clear vs omit)', () => {
		expect(() =>
			teableAgent.buildRecordFields({ fields: FIELDS, input: { Name: null }, allowClear: false })
		).toThrow(/Fields is empty/);
		const cleared = teableAgent.buildRecordFields({
			fields: FIELDS,
			input: { Name: null, Email: '' },
			allowClear: true,
		});
		expect(cleared).toEqual({ fldName: null, fldEmail: null });
	});

	it('refuses an empty update', () => {
		expect(() =>
			teableAgent.buildRecordFields({ fields: FIELDS, input: {}, allowClear: true })
		).toThrow(/Fields is empty/);
	});
});

describe('update_record_ai', () => {
	it('sends typecast and field IDs, and clears nulls', async () => {
		sendRequest.mockResolvedValueOnce({ body: TABLES });
		sendRequest.mockResolvedValueOnce({ body: FIELDS });
		sendRequest.mockResolvedValueOnce({
			body: { id: 'rec1', fields: { fldName: 'Jane', fldEmail: null } },
		});
		await runAction({
			action: updateRecordAi,
			propsValue: {
				baseId: 'bse1',
				table: 'Contacts',
				recordId: 'rec1',
				fields: { Name: 'Jane', Email: null },
			},
		});
		expect(calls()[2]).toMatchObject({
			method: 'PATCH',
			body: {
				record: { fields: { fldName: 'Jane', fldEmail: null } },
				fieldKeyType: 'id',
				typecast: true,
			},
		});
	});
});

describe('upsert_record_ai branches', () => {
	function mockUpsertLookup(records: unknown[]) {
		sendRequest.mockResolvedValueOnce({ body: TABLES });
		sendRequest.mockResolvedValueOnce({ body: FIELDS });
		sendRequest.mockResolvedValueOnce({ body: { records } });
	}

	it('creates when no record matches', async () => {
		mockUpsertLookup([]);
		sendRequest.mockResolvedValueOnce({
			body: { records: [{ id: 'recNew', fields: { fldEmail: 'a@b.c' } }] },
		});
		const output = await runAction({
			action: upsertRecordAi,
			propsValue: {
				baseId: 'bse1',
				table: 'Contacts',
				keyColumn: 'Email',
				fields: { Email: 'a@b.c', Name: 'Jane' },
			},
		});
		expect(output).toMatchObject({ action: 'created', record: { id: 'recNew' } });
		expect(calls()[3].method).toBe('POST');
		const lookupUrl = calls()[2].url;
		expect(lookupUrl).toContain('take=2');
		expect(lookupUrl).toContain(encodeURIComponent('"fieldId":"fldEmail"'));
	});

	it('updates when exactly one record matches', async () => {
		mockUpsertLookup([{ id: 'rec1', fields: {} }]);
		sendRequest.mockResolvedValueOnce({ body: { id: 'rec1', fields: { fldEmail: 'a@b.c' } } });
		const output = await runAction({
			action: upsertRecordAi,
			propsValue: {
				baseId: 'bse1',
				table: 'Contacts',
				keyColumn: 'Email',
				fields: { Email: 'a@b.c', Name: 'Jane' },
			},
		});
		expect(output).toMatchObject({ action: 'updated', record: { id: 'rec1' } });
		expect(calls()[3].method).toBe('PATCH');
		expect(calls()[3].url).toContain('/record/rec1');
	});

	it('refuses when several records match', async () => {
		mockUpsertLookup([
			{ id: 'rec1', fields: {} },
			{ id: 'rec2', fields: {} },
		]);
		await expect(
			runAction({
				action: upsertRecordAi,
				propsValue: {
					baseId: 'bse1',
					table: 'Contacts',
					keyColumn: 'Email',
					fields: { Email: 'a@b.c' },
				},
			})
		).rejects.toThrow(/More than one record matches Email/);
		expect(calls()).toHaveLength(3);
	});

	it('requires the key value in Fields', async () => {
		sendRequest.mockResolvedValueOnce({ body: TABLES });
		sendRequest.mockResolvedValueOnce({ body: FIELDS });
		await expect(
			runAction({
				action: upsertRecordAi,
				propsValue: {
					baseId: 'bse1',
					table: 'Contacts',
					keyColumn: 'Email',
					fields: { Name: 'Jane' },
				},
			})
		).rejects.toThrow(/Fields must include a value for the key column "Email"/);
	});
});
