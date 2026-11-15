import { beforeEach, expect, test, vi } from 'vitest';
import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { engineContext, rowEvents } from './support/engine-context';

vi.mock('../src/lib/triggers/helpers', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, getWorkSheetGridSize: async () => ({ rowCount: 1000, columnCount: 26 }) };
});

const { getRowsAction } = await import('../src/lib/actions/get-rows');
const { sheetsGetNextRows } = await import('../src/lib/actions/sheets-get-next-rows');

const values: string[][] = [['name'], ['r2'], ['r3'], [], ['r5'], ['r6'], ['r7']];

function fakeSheetsRest() {
  return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
    const base = 'https://sheets.googleapis.com/v4/spreadsheets/ss1';
    if (request.url === base) {
      return { status: 200, headers: {}, body: { sheets: [{ properties: { title: 'Sheet1', sheetId: 0 } }] } };
    }
    const prefix = `${base}/values/`;
    if (!request.url.startsWith(prefix)) throw new Error(`unexpected request ${request.url}`);
    const range = decodeURIComponent(request.url.slice(prefix.length));
    const m = /^Sheet1(?:!A(\d+):ZZZ(\d*))?$/.exec(range);
    if (!m) throw new Error(`unexpected range ${range}`);
    const from = m[1] ? Number(m[1]) : 1;
    const to = m[2] ? Number(m[2]) : values.length;
    const slice = values.slice(from - 1, Math.min(to, values.length));
    while (slice.length && slice[slice.length - 1].length === 0) slice.pop();
    return { status: 200, headers: {}, body: slice.length ? { range, values: slice } : { range } };
  });
}

function actionContext({ store, propsValue }: { store: Map<string, unknown>; propsValue: Record<string, unknown> }): EngineContext {
  return engineContext({
    context: {
      auth: { type: AppConnectionType.OAUTH2, access_token: 'tkn', data: {} },
      propsValue,
      store: {
        async get<T>(key: string): Promise<T | null> { return store.has(key) ? Reflect.apply(Map.prototype.get, store, [key]) : null; },
        async put<T>(key: string, value: T) { store.set(key, value); return value; },
        async delete(key: string) { store.delete(key); },
      },
    },
  });
}

async function walk({ run, propsValue, runs }: { run: (ctx: EngineContext) => Promise<unknown>; propsValue: Record<string, unknown>; runs: number }) {
  const store = new Map<string, unknown>();
  const seen: unknown[] = [];
  for (let i = 0; i < runs; i++) {
    const rows = rowEvents({ value: await run(actionContext({ store, propsValue })) });
    seen.push(...rows.map((r) => r.values['A']).filter((v) => v));
  }
  return seen;
}

beforeEach(() => {
  vi.restoreAllMocks();
  fakeSheetsRest();
});

test('get_next_rows (Group Size 1) returns the rows after a blank row', async () => {
  const seen = await walk({
    run: getRowsAction.run,
    propsValue: {
      spreadsheetId: 'ss1', sheetId: 0, startRow: 2, headerRow: 1, useHeaderNames: false, memKey: 'row_number', groupSize: 1,
    },
    runs: 10,
  });
  expect(seen).toEqual(['r2', 'r3', 'r5', 'r6', 'r7']);
});

test('sheets_get_next_rows (Group Size 1) returns the rows after a blank row', async () => {
  const seen = await walk({
    run: sheetsGetNextRows.run,
    propsValue: {
      spreadsheet_id: 'ss1', sheet_id: 0, start_row: 2, header_row: 1, use_header_names: false, mem_key: 'row_number', group_size: 1,
    },
    runs: 10,
  });
  expect(seen).toEqual(['r2', 'r3', 'r5', 'r6', 'r7']);
});

type EngineContext = Parameters<typeof getRowsAction.run>[0] & Parameters<typeof sheetsGetNextRows.run>[0];
