import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { listDocTablesAction } from '../src/lib/actions/ai/list-doc-tables';
import { getTableByIdAction } from '../src/lib/actions/ai/get-table-by-id';
import { listColumnsAction } from '../src/lib/actions/list-columns';
import { listRowsAction } from '../src/lib/actions/list-rows';
import { getRowByIdAction } from '../src/lib/actions/ai/get-row-by-id';
import { createRowsAction } from '../src/lib/actions/create-rows';
import { upsertRowsAction } from '../src/lib/actions/upsert-rows';
import { updateRowByIdAction } from '../src/lib/actions/ai/update-row-by-id';
import { deleteRowsAction } from '../src/lib/actions/delete-rows';
import { pushButtonAction } from '../src/lib/actions/push-button';
import { run, SeenRequest, stubFetch } from './helpers';

function mutationServer(write: { status?: number; body: unknown }) {
	return (request: SeenRequest) => (request.path.startsWith('/mutationStatus') ? { body: { completed: true } } : { status: write.status ?? 202, body: write.body });
}

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('table and column reads', () => {
	test('list_doc_tables defaults to tables', async () => {
		const seen = stubFetch(() => ({ body: { items: [] } }));
		await run(listDocTablesAction)({ docId: 'd' });
		expect(seen[0].path).toBe('/docs/d/tables');
		expect(seen[0].query.get('tableTypes')).toBe('table');
	});
	test('get_table_by_id encodes a table name', async () => {
		const seen = stubFetch(() => ({ body: { id: 'grid-1' } }));
		await run(getTableByIdAction)({ docId: 'd', tableIdOrName: 'Tasks & Bugs' });
		expect(seen[0].url).toContain('/docs/d/tables/Tasks%20%26%20Bugs');
	});
	test('list_columns visible only', async () => {
		const seen = stubFetch(() => ({ body: { items: [{ id: 'c-1' }] } }));
		await expect(run(listColumnsAction)({ docId: 'd', tableIdOrName: 't', visibleOnly: true })).resolves.toMatchObject({ items: [{ id: 'c-1' }] });
		expect(seen[0].path).toBe('/docs/d/tables/t/columns');
		expect(seen[0].query.get('visibleOnly')).toBe('true');
	});
});

describe('list_rows', () => {
	test('builds the filter query and defaults', async () => {
		const seen = stubFetch(() => ({ body: { items: [{ id: 'i-1' }], nextPageToken: 'next' } }));
		const result = await run(listRowsAction)({ docId: 'd', tableIdOrName: 't', filterColumn: 'Status', filterValue: 'Open', limit: 2 });
		expect(result).toEqual({ items: [{ id: 'i-1' }], nextPageToken: 'next', hasMore: true });
		expect(Object.fromEntries(seen[0].query)).toEqual({
			query: '"Status":"Open"',
			sortBy: 'natural',
			useColumnNames: 'true',
			valueFormat: 'simpleWithArrays',
			limit: '2',
		});
	});
	test('value without column, and column without value, are refused', async () => {
		const seen = stubFetch(() => ({ body: { items: [] } }));
		await expect(run(listRowsAction)({ docId: 'd', tableIdOrName: 't', filterValue: 'x' })).rejects.toThrow(/Filter Column/);
		await expect(run(listRowsAction)({ docId: 'd', tableIdOrName: 't', filterColumn: 'c-1' })).rejects.toThrow(/Filter Value/);
		expect(seen).toHaveLength(0);
	});
	test('limit capped at 500', async () => {
		await expect(run(listRowsAction)({ docId: 'd', tableIdOrName: 't', limit: 501 })).rejects.toThrow(/between 1 and 500/);
	});
	test('column ids can be turned off', async () => {
		const seen = stubFetch(() => ({ body: { items: [] } }));
		await run(listRowsAction)({ docId: 'd', tableIdOrName: 't', useColumnNames: false, pageToken: 'tok' });
		expect(seen[0].query.get('useColumnNames')).toBe('false');
		expect(seen[0].query.get('pageToken')).toBe('tok');
	});
});

describe('get_row_by_id', () => {
	test('encodes and asks for names', async () => {
		const seen = stubFetch(() => ({ body: { id: 'i-1' } }));
		await run(getRowByIdAction)({ docId: 'd', tableIdOrName: 't', rowIdOrName: 'i-1' });
		expect(seen[0].path).toBe('/docs/d/tables/t/rows/i-1');
		expect(seen[0].query.get('useColumnNames')).toBe('true');
	});
	test('refuses a dot-dot row id', async () => {
		await expect(run(getRowByIdAction)({ docId: 'd', tableIdOrName: 't', rowIdOrName: '..' })).rejects.toThrow(/not a valid/);
	});
});

describe('create_rows', () => {
	test('posts each row as cells, skipping null, and waits', async () => {
		const seen = stubFetch(mutationServer({ body: { requestId: 'mutate:c', addedRowIds: ['i-1', 'i-2'] } }));
		const result = await run(createRowsAction)({
			docId: 'd',
			tableIdOrName: 't',
			rows: [{ Name: 'A', Amount: 5, Notes: null }, { Name: 'B', Done: false }],
			disableParsing: true,
		});
		expect(seen[0].body).toEqual({
			rows: [
				{ cells: [{ column: 'Name', value: 'A' }, { column: 'Amount', value: 5 }] },
				{ cells: [{ column: 'Name', value: 'B' }, { column: 'Done', value: false }] },
			],
		});
		expect(seen[0].query.get('disableParsing')).toBe('true');
		expect(result).toEqual({ addedRowIds: ['i-1', 'i-2'], requestId: 'mutate:c', completed: true, warning: null });
	});
	test('accepts a JSON string and a single object', async () => {
		const seen = stubFetch(mutationServer({ body: { requestId: 'r', addedRowIds: ['i-1'] } }));
		await run(createRowsAction)({ docId: 'd', tableIdOrName: 't', rows: '{"Name":"A"}' });
		expect(seen[0].body).toEqual({ rows: [{ cells: [{ column: 'Name', value: 'A' }] }] });
	});
	test.each([[[]], [[{}]], [['x']], ['not json'], [Array.from({ length: 501 }, () => ({ a: 1 }))]])('refuses %#', async (rows) => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(createRowsAction)({ docId: 'd', tableIdOrName: 't', rows })).rejects.toThrow();
		expect(seen).toHaveLength(0);
	});
});

describe('upsert_rows', () => {
	test('requires every key column in every row', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(
			run(upsertRowsAction)({ docId: 'd', tableIdOrName: 't', keyColumns: ['Email'], rows: [{ Email: 'a@b.c' }, { Name: 'x', Email: ' ' }] }),
		).rejects.toThrow(/Row 2 has no value for key column\(s\) Email/);
		expect(seen).toHaveLength(0);
	});
	test('refuses no key columns', async () => {
		await expect(run(upsertRowsAction)({ docId: 'd', tableIdOrName: 't', keyColumns: [], rows: [{ a: 1 }] })).rejects.toThrow(/key column/);
	});
	test('sends deduped key columns', async () => {
		const seen = stubFetch(mutationServer({ body: { requestId: 'r' } }));
		const result = await run(upsertRowsAction)({ docId: 'd', tableIdOrName: 't', keyColumns: ['Email', 'Email'], rows: [{ Email: 'a@b.c', Amount: 1 }] });
		expect(seen[0].body).toEqual({ rows: [{ cells: [{ column: 'Email', value: 'a@b.c' }, { column: 'Amount', value: 1 }] }], keyColumns: ['Email'] });
		expect(result).toEqual({ rowCount: 1, requestId: 'r', completed: true, warning: null });
	});
});

describe('update_row_by_id', () => {
	test('null clears, omitted stays untouched', async () => {
		const seen = stubFetch(mutationServer({ body: { requestId: 'r', id: 'i-1' } }));
		const result = await run(updateRowByIdAction)({ docId: 'd', tableIdOrName: 't', rowIdOrName: 'i-1', cells: { Notes: null, Status: 'Closed', Name: '' } });
		expect(seen[0].method).toBe('PUT');
		expect(seen[0].body).toEqual({
			row: { cells: [{ column: 'Notes', value: '' }, { column: 'Status', value: 'Closed' }, { column: 'Name', value: '' }] },
		});
		expect(result).toEqual({ id: 'i-1', requestId: 'r', completed: true, warning: null });
	});
	test('refuses an empty object', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(updateRowByIdAction)({ docId: 'd', tableIdOrName: 't', rowIdOrName: 'i-1', cells: {} })).rejects.toThrow(/at least one column/);
		await expect(run(updateRowByIdAction)({ docId: 'd', tableIdOrName: 't', rowIdOrName: 'i-1', cells: [1] })).rejects.toThrow(/object/);
		expect(seen).toHaveLength(0);
	});
});

describe('delete_rows', () => {
	test('dedupes ids and sends a DELETE body', async () => {
		const seen = stubFetch(mutationServer({ body: { requestId: 'r', rowIds: ['i-1', 'i-2'] } }));
		const result = await run(deleteRowsAction)({ docId: 'd', tableIdOrName: 't', rowIds: ['i-1', ' i-1 ', 'i-2', ''] });
		expect(seen[0].method).toBe('DELETE');
		expect(seen[0].body).toEqual({ rowIds: ['i-1', 'i-2'] });
		expect(result).toEqual({ rowIds: ['i-1', 'i-2'], requestId: 'r', completed: true, warning: null });
	});
	test('refuses an empty list', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(deleteRowsAction)({ docId: 'd', tableIdOrName: 't', rowIds: [] })).rejects.toThrow(/at least one row ID/);
		expect(seen).toHaveLength(0);
	});
});

describe('push_button', () => {
	test('posts to the button path', async () => {
		const seen = stubFetch(mutationServer({ body: { requestId: 'r', rowId: 'i-1', columnId: 'c-b' } }));
		const result = await run(pushButtonAction)({ docId: 'd', tableIdOrName: 't', rowIdOrName: 'i-1', columnIdOrName: 'Mark Done' });
		expect(seen[0].method).toBe('POST');
		expect(seen[0].url).toContain('/docs/d/tables/t/rows/i-1/buttons/Mark%20Done');
		expect(result).toEqual({ rowId: 'i-1', columnId: 'c-b', requestId: 'r', completed: true, warning: null });
	});
});
