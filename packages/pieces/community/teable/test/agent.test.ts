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

	it('creates when no record matches and rechecks the key afterwards', async () => {
		mockUpsertLookup([]);
		sendRequest.mockResolvedValueOnce({
			body: { records: [{ id: 'recNew', fields: { fldEmail: 'a@b.c' } }] },
		});
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
		expect(output).not.toHaveProperty('warning');
		expect(calls()[3].method).toBe('POST');
		const lookupUrl = calls()[2].url;
		expect(lookupUrl).toContain('take=2');
		expect(lookupUrl).toContain(encodeURIComponent('"fieldId":"fldEmail"'));
		expect(calls()[4].url).toContain(encodeURIComponent('"fieldId":"fldEmail"'));
	});

	it('drops null values on the create branch', async () => {
		mockUpsertLookup([]);
		sendRequest.mockResolvedValueOnce({
			body: { records: [{ id: 'recNew', fields: { fldEmail: 'a@b.c' } }] },
		});
		sendRequest.mockResolvedValueOnce({
			body: { records: [{ id: 'recNew', fields: { fldEmail: 'a@b.c' } }] },
		});
		await runAction({
			action: upsertRecordAi,
			propsValue: {
				baseId: 'bse1',
				table: 'Contacts',
				keyColumn: 'Email',
				fields: { Email: 'a@b.c', Name: null },
			},
		});
		expect(calls()[3].body).toMatchObject({
			records: [{ fields: { fldEmail: 'a@b.c' } }],
		});
		const createFields = (calls()[3].body as { records: { fields: object }[] }).records[0]
			.fields;
		expect(createFields).not.toHaveProperty('fldName');
	});

	it('still returns the created record when the duplicate recheck fails', async () => {
		mockUpsertLookup([]);
		sendRequest.mockResolvedValueOnce({
			body: { records: [{ id: 'recNew', fields: { fldEmail: 'a@b.c' } }] },
		});
		sendRequest.mockRejectedValueOnce(new Error('429 Too Many Requests'));
		const output = await runAction({
			action: upsertRecordAi,
			propsValue: {
				baseId: 'bse1',
				table: 'Contacts',
				keyColumn: 'Email',
				fields: { Email: 'a@b.c' },
			},
		});
		expect(output).toMatchObject({
			action: 'created',
			record: { id: 'recNew' },
			warning: expect.stringMatching(/duplicate check could not run/),
		});
	});

	it('warns when a parallel upsert double-created the key', async () => {
		mockUpsertLookup([]);
		sendRequest.mockResolvedValueOnce({
			body: { records: [{ id: 'recNew', fields: { fldEmail: 'a@b.c' } }] },
		});
		sendRequest.mockResolvedValueOnce({
			body: {
				records: [
					{ id: 'recNew', fields: {} },
					{ id: 'recOther', fields: {} },
				],
			},
		});
		const output = await runAction({
			action: upsertRecordAi,
			propsValue: {
				baseId: 'bse1',
				table: 'Contacts',
				keyColumn: 'Email',
				fields: { Email: 'a@b.c' },
			},
		});
		expect(output).toMatchObject({
			action: 'created',
			warning: expect.stringMatching(/More than one record now matches Email/),
		});
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

	it('clears null values on the update branch', async () => {
		mockUpsertLookup([{ id: 'rec1', fields: {} }]);
		sendRequest.mockResolvedValueOnce({
			body: { id: 'rec1', fields: { fldEmail: 'a@b.c', fldName: null } },
		});
		await runAction({
			action: upsertRecordAi,
			propsValue: {
				baseId: 'bse1',
				table: 'Contacts',
				keyColumn: 'Email',
				fields: { Email: 'a@b.c', Name: null },
			},
		});
		expect(calls()[3]).toMatchObject({
			method: 'PATCH',
			body: {
				record: { fields: { fldEmail: 'a@b.c', fldName: null } },
				fieldKeyType: 'id',
				typecast: true,
			},
		});
	});

	it('refuses a null key value', async () => {
		sendRequest.mockResolvedValueOnce({ body: TABLES });
		sendRequest.mockResolvedValueOnce({ body: FIELDS });
		await expect(
			runAction({
				action: upsertRecordAi,
				propsValue: {
					baseId: 'bse1',
					table: 'Contacts',
					keyColumn: 'Email',
					fields: { Email: null, Name: 'Jane' },
				},
			})
		).rejects.toThrow(/Fields must include a value for the key column "Email"/);
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
