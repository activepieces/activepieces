import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRecordAi } from '../src/lib/actions/create-record-ai';
import { getDatabaseSchemaAi } from '../src/lib/actions/get-database-schema-ai';
import { updateRecordAi } from '../src/lib/actions/update-record-ai';
import { upsertRecordAi } from '../src/lib/actions/upsert-record-ai';
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

const CONTACTS = {
	id: 'tbl1',
	name: 'Contacts',
	primaryFieldId: 'f-name',
	fields: [
		{ id: 'f-name', name: 'Name', type: 'SINGLE_LINE_TEXT', readonly: false, allowMultipleEntries: false, required: true },
		{ id: 'f-email', name: 'Email', type: 'EMAIL', readonly: false, allowMultipleEntries: false },
		{ id: 'f-age', name: 'Age', type: 'NUMBER', readonly: false, allowMultipleEntries: false },
		{
			id: 'f-status',
			name: 'Status',
			type: 'SELECT',
			readonly: false,
			allowMultipleEntries: false,
			options: { choices: [{ id: 'opt-open', label: 'Open' }, { id: 'opt-done', label: 'Done' }] },
		},
		{ id: 'f-rid', name: 'Record ID', type: 'RECORD_ID', readonly: true, allowMultipleEntries: false },
	],
};

const TABLES = [CONTACTS, { id: 'tbl2', name: 'Orders', fields: [] }];

function savedRecord(fields: Record<string, unknown>) {
	return { body: { data: { id: 'r1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', fields } } };
}

function calls(): { method: string; url: string; body?: unknown }[] {
	return sendRequest.mock.calls.map((c) => c[0]);
}

beforeEach(() => {
	sendRequest.mockReset();
});

describe('Get Database Schema (Agent)', () => {
	it('returns every table with columns and select options in one call', async () => {
		sendRequest.mockResolvedValueOnce({ body: { data: TABLES } });
		const output = await runAction({ action: getDatabaseSchemaAi, propsValue: { databaseId: ' db1 ' } });
		expect(calls()).toHaveLength(1);
		expect(calls()[0].url).toBe('https://tables-api.softr.io/api/v1/databases/db1/tables');
		expect(output).toMatchObject({
			databaseId: 'db1',
			tableCount: 2,
			tables: [
				{
					id: 'tbl1',
					name: 'Contacts',
					fields: expect.arrayContaining([
						{
							id: 'f-status',
							name: 'Status',
							type: 'SELECT',
							required: false,
							readonly: false,
							allowMultipleEntries: false,
							options: [
								{ id: 'opt-open', label: 'Open' },
								{ id: 'opt-done', label: 'Done' },
							],
						},
					]),
				},
				{ id: 'tbl2', name: 'Orders', fields: [] },
			],
		});
	});
});

describe('Create Record (Agent)', () => {
	it('resolves the table by name and columns by name (any case) or ID, converting values', async () => {
		sendRequest.mockResolvedValueOnce({ body: { data: TABLES } }).mockResolvedValueOnce(savedRecord({ 'f-name': 'Jane', 'f-age': 30 }));
		const output = await runAction({
			action: createRecordAi,
			propsValue: { databaseId: 'db1', table: 'contacts', fields: { name: 'Jane', 'f-age': '30', STATUS: 'open', Email: '' } },
		});
		expect(calls()).toHaveLength(2);
		expect(calls()[1]).toMatchObject({
			method: 'POST',
			url: 'https://tables-api.softr.io/api/v1/databases/db1/tables/tbl1/records',
			body: { fields: { 'f-name': 'Jane', 'f-age': 30, 'f-status': 'opt-open' } },
		});
		expect(output).toMatchObject({ id: 'r1', fields: { Name: 'Jane', Age: 30 } });
	});

	it.each([
		[{ Name: 'A', Status: 'Secret-Diagnosis' }, 'is not one of its options'],
		[{ Name: 'A', Age: 'Secret-Diagnosis' }, 'must be a number'],
	])('names the column but never echoes the value in a conversion error (%j)', async (fields, message) => {
		sendRequest.mockResolvedValueOnce({ body: { data: TABLES } });
		const error = await runAction({ action: createRecordAi, propsValue: { databaseId: 'db1', table: 'tbl1', fields } }).catch((e: unknown) => e);
		expect(String(error)).toContain(message);
		expect(String(error)).not.toContain('Secret-Diagnosis');
	});

	it('accepts a table ID', async () => {
		sendRequest.mockResolvedValueOnce({ body: { data: TABLES } }).mockResolvedValueOnce(savedRecord({}));
		await runAction({ action: createRecordAi, propsValue: { databaseId: 'db1', table: 'tbl1', fields: { Name: 'A' } } });
		expect(calls()[1].url).toContain('/tables/tbl1/records');
	});

	it('rejects an ambiguous table name', async () => {
		sendRequest.mockResolvedValueOnce({ body: { data: [CONTACTS, { ...CONTACTS, id: 'tbl9' }] } });
		await expect(
			runAction({ action: createRecordAi, propsValue: { databaseId: 'db1', table: 'Contacts', fields: { Name: 'A' } } }),
		).rejects.toThrow('2 tables are named "Contacts" (IDs: tbl1, tbl9)');
	});

	it('names the valid columns when one is unknown and writes nothing', async () => {
		sendRequest.mockResolvedValueOnce({ body: { data: TABLES } });
		await expect(
			runAction({ action: createRecordAi, propsValue: { databaseId: 'db1', table: 'Contacts', fields: { Phone: '1' } } }),
		).rejects.toThrow('Column "Phone" does not exist in this table. Valid columns: Name, Email, Age, Status.');
		expect(calls()).toHaveLength(1);
	});

	it('rejects unknown select options and read-only columns', async () => {
		sendRequest.mockResolvedValue({ body: { data: TABLES } });
		await expect(
			runAction({ action: createRecordAi, propsValue: { databaseId: 'db1', table: 'Contacts', fields: { Status: 'Later' } } }),
		).rejects.toThrow('Options: Open, Done');
		await expect(
			runAction({ action: createRecordAi, propsValue: { databaseId: 'db1', table: 'Contacts', fields: { 'Record ID': 'x' } } }),
		).rejects.toThrow('is read-only');
	});

	it('rejects fields that are not a JSON object', async () => {
		await expect(
			runAction({ action: createRecordAi, propsValue: { databaseId: 'db1', table: 'Contacts', fields: '[1]' } }),
		).rejects.toThrow('Fields must be a JSON object');
		expect(sendRequest).not.toHaveBeenCalled();
	});
});

describe('Update Record (Agent)', () => {
	it('patches only the given columns', async () => {
		sendRequest.mockResolvedValueOnce({ body: { data: TABLES } }).mockResolvedValueOnce(savedRecord({ 'f-age': 31 }));
		await runAction({ action: updateRecordAi, propsValue: { databaseId: 'db1', table: 'Contacts', recordId: ' r1 ', fields: { age: 31 } } });
		expect(calls()[1]).toMatchObject({
			method: 'PATCH',
			url: 'https://tables-api.softr.io/api/v1/databases/db1/tables/tbl1/records/r1',
			body: { fields: { 'f-age': 31 } },
		});
	});

	it('refuses empty fields without writing', async () => {
		sendRequest.mockResolvedValue({ body: { data: TABLES } });
		await expect(
			runAction({ action: updateRecordAi, propsValue: { databaseId: 'db1', table: 'Contacts', recordId: 'r1', fields: {} } }),
		).rejects.toThrow('Fields is empty');
		await expect(
			runAction({ action: updateRecordAi, propsValue: { databaseId: 'db1', table: 'Contacts', recordId: 'r1', fields: { Name: '' } } }),
		).rejects.toThrow('Fields is empty');
		expect(calls().every((c) => c.method === 'GET')).toBe(true);
	});
});

describe('Upsert Record (Agent)', () => {
	function mockSearch({ total }: { total: number }) {
		sendRequest.mockImplementation(async (req: { url: string; method: string }) => {
			if (req.url.endsWith('/tables')) {
				return { body: { data: TABLES } };
			}
			if (req.url.endsWith('/records/search')) {
				const data = Array.from({ length: Math.min(total, 2) }, (_, i) => ({ id: `r${i + 1}`, fields: {} }));
				return { body: { data, metadata: { offset: 0, limit: 2, total } } };
			}
			return savedRecord({ 'f-email': 'a@b.co' });
		});
	}

	const props = { databaseId: 'db1', table: 'Contacts', keyField: 'email', fields: { Email: 'a@b.co', Name: 'Ann' } };

	it('creates when no record matches the key', async () => {
		mockSearch({ total: 0 });
		const output = await runAction({ action: upsertRecordAi, propsValue: props });
		expect(calls()[1].body).toEqual({
			paging: { offset: 0, limit: 2 },
			filter: { condition: { operator: 'AND', conditions: [{ operator: 'IS', leftSide: 'f-email', rightSide: 'a@b.co' }] } },
		});
		expect(calls()[2]).toMatchObject({ method: 'POST', body: { fields: { 'f-email': 'a@b.co', 'f-name': 'Ann' } } });
		expect(output).toMatchObject({ action: 'created', record: { id: 'r1', fields: { Email: 'a@b.co' } } });
	});

	it('updates the single matching record', async () => {
		mockSearch({ total: 1 });
		const output = await runAction({ action: upsertRecordAi, propsValue: props });
		expect(calls()[2]).toMatchObject({ method: 'PATCH', url: expect.stringContaining('/tables/tbl1/records/r1') });
		expect(output).toMatchObject({ action: 'updated' });
	});

	it('refuses to guess when several records match', async () => {
		mockSearch({ total: 3 });
		await expect(runAction({ action: upsertRecordAi, propsValue: props })).rejects.toThrow(
			'3 records match the given Email, refusing to guess',
		);
		expect(calls()).toHaveLength(2);
	});

	it('needs the key value inside Fields', async () => {
		mockSearch({ total: 0 });
		await expect(
			runAction({ action: upsertRecordAi, propsValue: { ...props, fields: { Name: 'Ann' } } }),
		).rejects.toThrow('Fields must include a value for the key column "Email"');
		expect(calls()).toHaveLength(1);
	});
});
