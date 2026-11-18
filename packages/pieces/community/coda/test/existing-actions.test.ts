import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createRowAction } from '../src/lib/actions/create-row';
import { updateRowAction } from '../src/lib/actions/update-row';
import { upsertRowAction } from '../src/lib/actions/upsert-row';
import { findRowAction } from '../src/lib/actions/find-row';
import { getRowAction } from '../src/lib/actions/get-row';
import { getTableAction } from '../src/lib/actions/get-table';
import { listTablesAction } from '../src/lib/actions/list-tables';
import { replies, run, stubFetch } from './helpers';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('existing actions keep their names and become human-only', () => {
	test.each([
		[createRowAction, 'create-row'],
		[updateRowAction, 'update-row'],
		[upsertRowAction, 'upsert-row'],
		[findRowAction, 'find-row'],
		[getRowAction, 'get-row'],
		[getTableAction, 'get-table'],
		[listTablesAction, 'list-tables'],
	])('%#', (action, name) => {
		expect(action.name).toBe(name);
		expect(action.audience).toBe('human');
		expect(action.outputSchema).toBeDefined();
	});
});

describe('create-row', () => {
	test('posts non-empty cells and returns rowId plus requestId without waiting', async () => {
		const seen = stubFetch(() => ({ status: 202, body: { requestId: 'mutate:1', addedRowIds: ['i-1'] } }));
		const result = await run(createRowAction)({
			docId: 'doc1',
			tableId: 'grid-1',
			rowData: { 'c-a': 'x', 'c-b': '', 'c-c': null, 'c-d': 0, 'c-e': false },
		});
		expect(result).toEqual({ rowId: 'i-1', requestId: 'mutate:1' });
		expect(seen).toHaveLength(1);
		expect(seen[0].method).toBe('POST');
		expect(seen[0].path).toBe('/docs/doc1/tables/grid-1/rows');
		expect(seen[0].body).toEqual({
			rows: [{ cells: [{ column: 'c-a', value: 'x' }, { column: 'c-d', value: 0 }, { column: 'c-e', value: false }] }],
		});
	});
	test('refuses an empty row', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(createRowAction)({ docId: 'd', tableId: 't', rowData: {} })).rejects.toThrow(/column values/);
		expect(seen).toHaveLength(0);
	});
});

describe('update-row', () => {
	test('refuses empty cells before any request', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(updateRowAction)({ docId: 'd', tableId: 't', rowIdOrName: 'i-1', rowData: { 'c-a': '' } })).rejects.toThrow(
			/at least one column value/,
		);
		expect(seen).toHaveLength(0);
	});
	test('PUTs the row with an encoded row name', async () => {
		const seen = stubFetch(() => ({ status: 202, body: { requestId: 'mutate:2', id: 'i-9' } }));
		const result = await run(updateRowAction)({ docId: 'd', tableId: 't', rowIdOrName: 'Row/1', rowData: { 'c-a': 'v' } });
		expect(result).toEqual({ rowId: 'i-9', requestId: 'mutate:2' });
		expect(seen[0].method).toBe('PUT');
		expect(seen[0].url).toContain('/docs/d/tables/t/rows/Row%2F1');
		expect(seen[0].body).toEqual({ row: { cells: [{ column: 'c-a', value: 'v' }] } });
	});
});

describe('upsert-row', () => {
	test('refuses when a key column has no value', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(
			run(upsertRowAction)({ docId: 'd', tableId: 't', keyColumns: ['c-key'], rowData: { 'c-other': 'v' } }),
		).rejects.toThrow(/Missing values for: c-key/);
		expect(seen).toHaveLength(0);
	});
	test('sends keyColumns and returns requestId', async () => {
		const seen = stubFetch(() => ({ status: 202, body: { requestId: 'mutate:3' } }));
		const result = await run(upsertRowAction)({ docId: 'd', tableId: 't', keyColumns: ['c-key'], rowData: { 'c-key': 'k', 'c-v': 1 } });
		expect(result).toEqual({ success: true, requestId: 'mutate:3' });
		expect(seen[0].body).toEqual({ rows: [{ cells: [{ column: 'c-key', value: 'k' }, { column: 'c-v', value: 1 }] }], keyColumns: ['c-key'] });
	});
	test('has an output schema with the request id', () => {
		expect(upsertRowAction.outputSchema?.fields.map((field) => field.key)).toEqual(['success', 'requestId']);
	});
});

describe('find-row', () => {
	test('queries by column id with a quoted value, page size 500, all pages', async () => {
		const seen = stubFetch(
			replies([
				{ body: { items: [{ id: 'i-1' }], nextPageToken: 'p2' } },
				{ body: { items: [{ id: 'i-2' }] } },
			]),
		);
		const result = await run(findRowAction)({ docId: 'd', tableId: 't', searchColumn: 'c-amount', searchValue: '10' });
		expect(result).toEqual({ found: true, result: [{ id: 'i-1' }, { id: 'i-2' }] });
		expect(seen[0].query.get('query')).toBe('c-amount:"10"');
		expect(seen[0].query.get('limit')).toBe('500');
		expect(seen[1].query.get('pageToken')).toBe('p2');
	});
	test('stops at Max Rows', async () => {
		const seen = stubFetch(() => ({ body: { items: [{ id: 'a' }, { id: 'b' }], nextPageToken: 'more' } }));
		const result = await run(findRowAction)({ docId: 'd', tableId: 't', searchColumn: 'c-a', searchValue: 'x', maxRows: 1 });
		expect(result).toEqual({ found: true, result: [{ id: 'a' }] });
		expect(seen).toHaveLength(1);
	});
	test('rejects a bad Max Rows', async () => {
		await expect(run(findRowAction)({ docId: 'd', tableId: 't', searchColumn: 'c-a', searchValue: 'x', maxRows: 0 })).rejects.toThrow();
	});
});

describe('get-row / get-table / list-tables', () => {
	test('get-row asks for column names and simpleWithArrays', async () => {
		const seen = stubFetch(() => ({ body: { id: 'i-1' } }));
		await run(getRowAction)({ docId: 'd', tableId: 't', rowIdOrName: 'i-1' });
		expect(seen[0].path).toBe('/docs/d/tables/t/rows/i-1');
		expect(seen[0].query.get('useColumnNames')).toBe('true');
		expect(seen[0].query.get('valueFormat')).toBe('simpleWithArrays');
	});
	test('get-table description no longer promises columns', async () => {
		expect(getTableAction.description).not.toMatch(/columns, schema/);
		const seen = stubFetch(() => ({ body: { id: 't' } }));
		await run(getTableAction)({ docId: 'd', tableId: 't' });
		expect(seen[0].path).toBe('/docs/d/tables/t');
	});
	test('list-tables refuses max below 1', async () => {
		const seen = stubFetch(() => ({ body: { items: [] } }));
		await expect(run(listTablesAction)({ docId: 'd', max: 0 })).rejects.toThrow(/Max Tables/);
		expect(seen).toHaveLength(0);
	});
	test('list-tables trims to max', async () => {
		stubFetch(() => ({ body: { items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], nextPageToken: 'n' } }));
		await expect(run(listTablesAction)({ docId: 'd', max: 2 })).resolves.toEqual({ found: true, result: [{ id: 'a' }, { id: 'b' }] });
	});
});
