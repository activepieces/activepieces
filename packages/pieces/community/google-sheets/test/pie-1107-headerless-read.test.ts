import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getManyRowsAction } from '../src/lib/actions/get-many-rows';
import { getRowsAction } from '../src/lib/actions/get-rows';
import { sheetsGetAllRows } from '../src/lib/actions/sheets-get-all-rows';
import { sheetsGetNextRows } from '../src/lib/actions/sheets-get-next-rows';
import { engineContext, isRecord, rowEvents } from './support/engine-context';
import { installFakeGoogle, memoryStore, resetFakeGoogle } from './support/fake-google';
import { installFakeSheetsRest } from './support/sheets-rest';
import { tabOf } from './support/row-trigger-context';

const SPREADSHEET = 'spreadsheet-1';
const EXPECTED = [
	{ row: 2, values: { A: 'a', B: 'b' } },
	{ row: 3, values: { A: 'c', B: 'd' } },
];

function actionContext<T>({ propsValue }: { propsValue: Record<string, unknown> }): T {
	return engineContext({
		context: {
			auth: { type: 'OAUTH2', access_token: 'token', props: {}, data: {} },
			propsValue,
			store: memoryStore().store,
		},
	});
}

function nonEmpty({ value }: { value: unknown }) {
	return rowEvents({ value }).filter((row) => Object.keys(row.values).length > 0);
}

beforeEach(() => {
	installFakeGoogle();
	installFakeSheetsRest();
	resetFakeGoogle({ tabs: [tabOf({ rows: [[], ['a', 'b'], ['c', 'd']], title: 'Sheet1', sheetId: 0 })] });
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('PIE-1107 reading rows by column letter does not need a header row', () => {
	it('sheets_get_all_rows with first_row_headers off returns every row keyed A, B', async () => {
		const result = await sheetsGetAllRows.run(
			actionContext({ propsValue: { spreadsheet_id: SPREADSHEET, sheet_id: 0, first_row_headers: false } }),
		);
		const rows = isRecord(result) ? result['rows'] : undefined;
		expect(nonEmpty({ value: rows })).toEqual(EXPECTED);
	});

	it('Get All Rows with First Row Contains Headers off returns every row', async () => {
		const result = await getManyRowsAction.run(
			actionContext({ propsValue: { spreadsheetId: SPREADSHEET, sheetId: 0, includeTeamDrives: false, first_row_headers: false } }),
		);
		expect(nonEmpty({ value: result })).toEqual(EXPECTED);
	});

	it('Get Next Rows (human) with Use Column Names off returns the next rows', async () => {
		const result = await getRowsAction.run(
			actionContext({
				propsValue: { spreadsheetId: SPREADSHEET, sheetId: 0, includeTeamDrives: false, startRow: 2, headerRow: 1, useHeaderNames: false, memKey: 'row_number', groupSize: 2 },
			}),
		);
		expect(result).toEqual(EXPECTED);
	});

	it('sheets_get_next_rows (AI) with Use Column Names off returns the next rows', async () => {
		const result = await sheetsGetNextRows.run(
			actionContext({
				propsValue: { spreadsheet_id: SPREADSHEET, sheet_id: 0, start_row: 2, header_row: 1, use_header_names: false, memKey: 'row_number', group_size: 2 },
			}),
		);
		expect(result).toEqual(EXPECTED);
	});
});
