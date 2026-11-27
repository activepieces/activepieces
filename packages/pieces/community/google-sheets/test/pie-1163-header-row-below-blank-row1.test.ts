import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { findRowByNumAction } from '../src/lib/actions/find-row-by-num';
import { getRowsAction } from '../src/lib/actions/get-rows';
import { sheetsGetNextRows } from '../src/lib/actions/sheets-get-next-rows';
import { engineContext } from './support/engine-context';
import { installFakeGoogle, memoryStore, resetFakeGoogle } from './support/fake-google';
import { installFakeSheetsRest } from './support/sheets-rest';
import { tabOf } from './support/row-trigger-context';

function actionContext<T>({ propsValue }: { propsValue: Record<string, unknown> }): T {
	return engineContext({
		context: {
			auth: { type: 'OAUTH2', access_token: 'token', props: {}, data: {} },
			propsValue: { includeTeamDrives: false, spreadsheetId: 'sp-1', sheetId: 5, ...propsValue },
			store: memoryStore().store,
		},
	});
}

beforeEach(() => {
	installFakeGoogle();
	installFakeSheetsRest();
	resetFakeGoogle({
		tabs: [tabOf({ rows: [[], [], ['Name', 'Email'], ['Ann', 'ann@x.io'], ['Bob', 'bob@x.io'], ['Cat', 'cat@x.io']], title: 'Contacts', sheetId: 5 })],
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('PIE-1163 Header Row 3 on a sheet whose row 1 is blank', () => {
	it('Get Row by Number without column names reads row 4', async () => {
		const out = await findRowByNumAction.run(actionContext({ propsValue: { rowNumber: 4, headerRow: 3, useHeaderNames: false } }));
		expect(out).toEqual({ found: true, row: 4, values: { A: 'Ann', B: 'ann@x.io' } });
	});

	it('Get Row by Number with column names keys row 4 by the row-3 headings', async () => {
		const out = await findRowByNumAction.run(actionContext({ propsValue: { rowNumber: 4, headerRow: 3, useHeaderNames: true } }));
		expect(out).toEqual({ found: true, row: 4, values: { Name: 'Ann', Email: 'ann@x.io' } });
	});

	it('Get Next Rows with column names returns rows 4-5 keyed by the row-3 headings', async () => {
		const out = await getRowsAction.run(
			actionContext({ propsValue: { startRow: 4, groupSize: 2, headerRow: 3, useHeaderNames: true, memKey: 'row_number' } }),
		);
		expect(out).toEqual([
			{ row: 4, values: { Name: 'Ann', Email: 'ann@x.io' } },
			{ row: 5, values: { Name: 'Bob', Email: 'bob@x.io' } },
		]);
	});

	it('sheets_get_next_rows with column names returns rows 4-5 keyed by the row-3 headings', async () => {
		const out = await sheetsGetNextRows.run(
			actionContext({ propsValue: { spreadsheet_id: 'sp-1', sheet_id: 5, start_row: 4, group_size: 2, header_row: 3, use_header_names: true, memKey: 'row_number' } }),
		);
		expect(out).toEqual([
			{ row: 4, values: { Name: 'Ann', Email: 'ann@x.io' } },
			{ row: 5, values: { Name: 'Bob', Email: 'bob@x.io' } },
		]);
	});
});
