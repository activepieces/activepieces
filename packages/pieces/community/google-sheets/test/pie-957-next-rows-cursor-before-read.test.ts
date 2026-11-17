import { beforeEach, describe, expect, test, vi } from 'vitest';
import { HttpError, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { engineContext, rowEvents } from './support/engine-context';

vi.mock('../src/lib/triggers/helpers', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getWorkSheetGridSize: async () => ({ rowCount: 1000, columnCount: 26 }),
  };
});

const { getRowsAction } = await import('../src/lib/actions/get-rows');
const { sheetsGetNextRows } = await import('../src/lib/actions/sheets-get-next-rows');

const values = [['name'], ['r2'], ['r3'], ['r4'], ['r5'], ['r6'], ['r7']];

function fakeSheetsRest() {
  let failuresLeft = 1;
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
    if (range === 'Sheet1!A2:ZZZ3' && failuresLeft > 0) {
      failuresLeft--;
      throw new HttpError(undefined, {
        status: 429,
        responseBody: { error: { code: 429, message: "Quota exceeded for quota metric 'Read requests' and limit 'Read requests per minute per user'", status: 'RESOURCE_EXHAUSTED' } },
      });
    }
    const from = m[1] ? Number(m[1]) : 1;
    const to = m[2] ? Number(m[2]) : values.length;
    const slice = values.slice(from - 1, Math.min(to, values.length));
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

async function scenario({ run, propsValue }: { run: (ctx: EngineContext) => Promise<unknown>; propsValue: Record<string, unknown> }) {
  const store = new Map<string, unknown>();
  await expect(run(actionContext({ store, propsValue }))).rejects.toThrow(/Quota exceeded/);
  const retried = rowEvents({ value: await run(actionContext({ store, propsValue })) });
  const delivered = retried.map((r) => r.values['A']);
  for (let i = 0; i < 4; i++) {
    const rows = rowEvents({ value: await run(actionContext({ store, propsValue })) });
    delivered.push(...rows.map((r) => r.values['A']));
  }
  return { retried: retried.map((r) => r.values['A']), delivered };
}

beforeEach(() => {
  vi.restoreAllMocks();
  fakeSheetsRest();
});

describe('a failed batch read does not advance the Get Next Rows cursor', () => {
  test('get_next_rows', async () => {
    const { retried, delivered } = await scenario({
      run: getRowsAction.run,
      propsValue: {
        spreadsheetId: 'ss1', sheetId: 0, startRow: 2, headerRow: 1, useHeaderNames: false, memKey: 'row_number', groupSize: 2,
      },
    });
    expect(retried).toEqual(['r2', 'r3']);
    expect(delivered).toEqual(['r2', 'r3', 'r4', 'r5', 'r6', 'r7']);
  });

  test('sheets_get_next_rows', async () => {
    const { retried, delivered } = await scenario({
      run: sheetsGetNextRows.run,
      propsValue: {
        spreadsheet_id: 'ss1', sheet_id: 0, start_row: 2, header_row: 1, use_header_names: false, mem_key: 'row_number', group_size: 2,
      },
    });
    expect(retried).toEqual(['r2', 'r3']);
    expect(delivered).toEqual(['r2', 'r3', 'r4', 'r5', 'r6', 'r7']);
  });
});

type EngineContext = Parameters<typeof getRowsAction.run>[0] & Parameters<typeof sheetsGetNextRows.run>[0];
