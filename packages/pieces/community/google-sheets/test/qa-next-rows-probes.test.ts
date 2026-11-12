import { HttpError, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { engineContext, rowEvents } from './support/engine-context';

const sheet = vi.hoisted((): SheetState => ({
	gridRows: 1000,
	values: [],
	failRanges: new Set<string>(),
}));

vi.mock('../src/lib/triggers/helpers', async (importOriginal) => {
	const actual = await importOriginal<Record<string, unknown>>();
	return { ...actual, getWorkSheetGridSize: async () => ({ rowCount: sheet.gridRows, columnCount: 26 }) };
});

const { getRowsAction } = await import('../src/lib/actions/get-rows');
const { sheetsGetNextRows } = await import('../src/lib/actions/sheets-get-next-rows');

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets/ss1';

function installSheetsRest(): void {
	vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
		if (request.url === BASE) {
			return { status: 200, headers: {}, body: { sheets: [{ properties: { title: 'Sheet1', sheetId: 0 } }] } };
		}
		const range = decodeURIComponent(request.url.slice(`${BASE}/values/`.length));
		const match = /^Sheet1(?:!A(\d+):ZZZ(\d*))?$/.exec(range);
		if (!match) throw new Error(`unexpected range ${range}`);
		if (sheet.failRanges.has(range)) {
			sheet.failRanges.delete(range);
			throw new HttpError(undefined, {
				status: 429,
				responseBody: { error: { code: 429, message: 'Quota exceeded for read requests', status: 'RESOURCE_EXHAUSTED' } },
			});
		}
		const from = match[1] ? Number(match[1]) : 1;
		const to = match[2] ? Number(match[2]) : sheet.values.length;
		if (from > sheet.gridRows || to > sheet.gridRows) {
			throw new HttpError(undefined, { status: 400, responseBody: { error: { code: 400, message: `Range (${range}) exceeds grid limits.` } } });
		}
		const slice = sheet.values.slice(from - 1, Math.min(to, sheet.values.length)).map((row) => [...row]);
		while (slice.length > 0 && slice[slice.length - 1].length === 0) slice.pop();
		return { status: 200, headers: {}, body: slice.length > 0 ? { range, values: slice } : { range } };
	});
}

const store = new Map<string, unknown>();

function actionContext({ propsValue }: { propsValue: Record<string, unknown> }): EngineContext {
	return engineContext({
		context: {
			auth: { type: AppConnectionType.OAUTH2, access_token: 'tkn', data: {} },
			propsValue,
			store: {
				async get<T>(key: string): Promise<T | null> {
					return store.has(key) ? Reflect.apply(Map.prototype.get, store, [key]) : null;
				},
				async put<T>(key: string, value: T) {
					store.set(key, value);
					return value;
				},
				async delete(key: string) {
					store.delete(key);
				},
			},
		},
	});
}

const variants = [
	{
		name: 'get_next_rows',
		action: getRowsAction,
		props: ({ groupSize, useHeaderNames = false }: { groupSize: number; useHeaderNames?: boolean }) => ({
			spreadsheetId: 'ss1', sheetId: 0, startRow: 2, headerRow: 1, useHeaderNames, memKey: 'row_number', groupSize,
		}),
	},
	{
		name: 'sheets_get_next_rows',
		action: sheetsGetNextRows,
		props: ({ groupSize, useHeaderNames = false }: { groupSize: number; useHeaderNames?: boolean }) => ({
			spreadsheet_id: 'ss1', sheet_id: 0, start_row: 2, header_row: 1, use_header_names: useHeaderNames, mem_key: 'row_number', group_size: groupSize,
		}),
	},
];

async function step({ run, propsValue }: { run: (ctx: EngineContext) => Promise<unknown>; propsValue: Record<string, unknown> }) {
	const rows = rowEvents({ value: await run(actionContext({ propsValue })) });
	return rows.filter((row) => Object.values(row.values).some((value) => value !== '')).map((row) => Object.values(row.values)[0]);
}

async function walk({ run, propsValue, runs }: { run: (ctx: EngineContext) => Promise<unknown>; propsValue: Record<string, unknown>; runs: number }) {
	const seen: unknown[] = [];
	for (let index = 0; index < runs; index++) {
		seen.push(...(await step({ run, propsValue })));
	}
	return seen;
}

beforeEach(() => {
	vi.restoreAllMocks();
	store.clear();
	sheet.gridRows = 1000;
	sheet.failRanges = new Set();
	installSheetsRest();
});

describe.each(variants)('QA probe $name', ({ action, props }) => {
	it('blank rows at the end of the data: waits, then picks up rows appended later (group size 1)', async () => {
		sheet.values = [['name'], ['r2'], ['r3']];
		const propsValue = props({ groupSize: 1 });
		expect(await walk({ run: action.run, propsValue, runs: 5 })).toEqual(['r2', 'r3']);
		expect(store.get('row_number')).toBe(4);
		sheet.values.push(['r4']);
		expect(await walk({ run: action.run, propsValue, runs: 2 })).toEqual(['r4']);
	});

	it('blank rows in the middle inside one batch do not skip the data after them', async () => {
		sheet.values = [['name'], ['r2'], [], [], [], ['r6'], ['r7']];
		expect(await walk({ run: action.run, propsValue: props({ groupSize: 2 }), runs: 6 })).toEqual(['r2', 'r6', 'r7']);
	});

	it('a partial last batch does not jump past rows appended later', async () => {
		sheet.values = [['name'], ['r2']];
		const propsValue = props({ groupSize: 5 });
		expect(await walk({ run: action.run, propsValue, runs: 1 })).toEqual(['r2']);
		sheet.values.push(['r3'], ['r4']);
		expect(await walk({ run: action.run, propsValue, runs: 2 })).toEqual(['r3', 'r4']);
	});

	it('a failed header read with Use Column Names does not move the cursor', async () => {
		sheet.values = [['name'], ['r2'], ['r3']];
		const propsValue = props({ groupSize: 1, useHeaderNames: true });
		sheet.failRanges.add('Sheet1!A1:ZZZ1');
		await expect(action.run(actionContext({ propsValue }))).rejects.toThrow(/Quota exceeded/);
		expect(store.has('row_number')).toBe(false);
		const rows = rowEvents({ value: await action.run(actionContext({ propsValue })) });
		expect(rows.map((row) => row.values)).toEqual([{ name: 'r2' }]);
	});

	it('an empty header row fails the read without moving the cursor', async () => {
		sheet.values = [[], ['r2'], ['r3']];
		const propsValue = props({ groupSize: 1 });
		await expect(action.run(actionContext({ propsValue }))).rejects.toThrow(/Unable to read headers/);
		expect(store.has('row_number')).toBe(false);
	});
});

type SheetState = { gridRows: number; values: string[][]; failRanges: Set<string> };
type EngineContext = Parameters<typeof getRowsAction.run>[0] & Parameters<typeof sheetsGetNextRows.run>[0];
