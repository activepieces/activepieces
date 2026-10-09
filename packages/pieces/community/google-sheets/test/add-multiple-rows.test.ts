import { AppConnectionType, createMockActionContext } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { insertMultipleRowsAction } from '../src/lib/actions/insert-multiple-rows.action';
import { sheetsAddMultipleRows } from '../src/lib/actions/sheets-add-multiple-rows';

const provider = vi.hoisted(() => ({
  readRows: vi.fn(),
  update: vi.fn(),
  batchUpdate: vi.fn(),
  batchClear: vi.fn(),
  append: vi.fn(),
}));

vi.mock('@googleapis/sheets', () => ({
  sheets: () => ({ spreadsheets: { values: provider } }),
}));

vi.mock('../src/lib/triggers/helpers', () => ({
  getWorkSheetName: async () => 'Data',
  getWorkSheetGridSize: async () => ({ rowCount: 10 }),
}));

vi.mock('../src/lib/common/common', async (importOriginal) => {
  const common = await importOriginal<typeof import('../src/lib/common/common')>();
  return {
    ...common,
    createGoogleClient: async () => ({}),
    googleSheetsCommon: { ...common.googleSheetsCommon, getGoogleSheetRows: provider.readRows },
  };
});

beforeEach(() => {
  vi.resetAllMocks();
  provider.readRows.mockImplementation(async ({ rowIndex_s, rowIndex_e }) => {
    if (rowIndex_s === rowIndex_e) {
      return [{ row: rowIndex_s, values: rowIndex_s === 3 || rowIndex_s === 1
        ? { A: 'Name', B: 'Age' }
        : { A: 'Annual report', B: '' } }];
    }
    return [{ row: 4, values: { A: 'Old user', B: '19' } }];
  });
  for (const method of [provider.update, provider.batchUpdate, provider.batchClear, provider.append]) {
    method.mockResolvedValue({ data: {} });
  }
});

describe.each(['human', 'ai'])('%s Add Multiple Rows respects Header Row', (audience) => {
  test.each([undefined, 1, 3])('overwrites only data below header row %i', async (headerRow) => {
    await runRows({ audience, headerRow, overwrite: true, inputType: 'json', values: [{ Name: 'Alice', Age: 20 }] });

    const effectiveHeaderRow = headerRow ?? 1;
    expect(provider.readRows).toHaveBeenCalledWith(expect.objectContaining({
      rowIndex_s: effectiveHeaderRow, rowIndex_e: effectiveHeaderRow, headerRow: effectiveHeaderRow,
    }));
    expect(provider.update).not.toHaveBeenCalled();
    expect(provider.batchUpdate).toHaveBeenCalledWith(expect.objectContaining({
      requestBody: {
        data: [{ range: `Data!A${effectiveHeaderRow + 1}:ZZZ${effectiveHeaderRow + 1}`, majorDimension: 'ROWS', values: [['Alice', 20]] }],
        valueInputOption: 'RAW',
      },
    }));
    expect(provider.batchClear).toHaveBeenCalledWith(expect.objectContaining({
      requestBody: { ranges: [`Data!A${effectiveHeaderRow + 2}:ZZZ10`] },
    }));
  });

  test.each([false, true])('adds missing JSON columns to row 3 with overwrite=%s', async (overwrite) => {
    await runRows({ audience, headerRow: 3, overwrite, inputType: 'json', values: [{ Name: 'Alice', City: 'Paris' }] });

    expect(provider.update).toHaveBeenCalledWith(expect.objectContaining({
      range: 'Data!A3:ZZZ3',
      requestBody: { majorDimension: 'ROWS', values: [['Name', 'Age', 'City']] },
    }));
    if (overwrite) {
      expect(provider.batchUpdate).toHaveBeenCalledWith(expect.objectContaining({
        requestBody: expect.objectContaining({
          data: [{ range: 'Data!A4:ZZZ4', majorDimension: 'ROWS', values: [['Alice', '', 'Paris']] }],
        }),
      }));
    } else {
      expect(provider.append).toHaveBeenCalledWith(expect.objectContaining({
        requestBody: { majorDimension: 'ROWS', values: [['Alice', '', 'Paris']] },
      }));
      expect(provider.batchClear).not.toHaveBeenCalled();
    }
  });

  test.each([false, true])('maps CSV against row 3 with overwrite=%s', async (overwrite) => {
    await runRows({ audience, headerRow: 3, overwrite, inputType: 'csv', values: 'Age,Name\n20,Alice' });

    const mutation = overwrite ? provider.batchUpdate : provider.append;
    const request = mutation.mock.calls[0][0];
    const values = overwrite ? request.requestBody.data[0].values : request.requestBody.values;
    expect(values).toEqual([['Alice', '20']]);
    expect(provider.update).not.toHaveBeenCalled();
  });

  test('starts duplicate checks below the header and preamble', async () => {
    await runRows({ audience, headerRow: 3, overwrite: false, inputType: 'json', values: [{ Name: 'Name', Age: 20 }, { Name: 'Old user', Age: 19 }], checkDuplicates: true });

    expect(provider.readRows).toHaveBeenLastCalledWith(expect.objectContaining({ rowIndex_s: 4, rowIndex_e: undefined, headerRow: 3 }));
    expect(provider.append).toHaveBeenCalledWith(expect.objectContaining({
      requestBody: { majorDimension: 'ROWS', values: [['Name', 20]] },
    }));
  });

  test.each([0, -1, 1.5, NaN])('rejects invalid header row %s before provider requests', async (headerRow) => {
    await expect(runRows({ audience, headerRow, overwrite: true, inputType: 'json', values: [{ Name: 'Alice' }] })).rejects.toThrow('Header row must be a positive integer.');
    expect(provider.readRows).not.toHaveBeenCalled();
    expect(provider.batchUpdate).not.toHaveBeenCalled();
  });
});

test('human column inputs and duplicate options read labels from row 3', async () => {
  const propsValue = { auth: connection, sheetId: 0, spreadsheetId: 'spreadsheet', input_type: 'column_names', headerRow: 3, check_for_duplicate: true };
  const context = createMockActionContext({ propsValue: {} });
  const fields = await insertMultipleRowsAction.props.values.props(propsValue, context);
  const duplicateFields = await insertMultipleRowsAction.props.check_for_duplicate_column.props(propsValue, context);

  expect(provider.readRows).toHaveBeenCalledTimes(2);
  expect(provider.readRows).toHaveBeenNthCalledWith(1, expect.objectContaining({ rowIndex_s: 3, rowIndex_e: 3, headerRow: 3 }));
  expect(provider.readRows).toHaveBeenNthCalledWith(2, expect.objectContaining({ rowIndex_s: 3, rowIndex_e: 3, headerRow: 3 }));
  expect(fields.values).toMatchObject({ properties: { A: { displayName: 'Name' }, B: { displayName: 'Age' } } });
  expect(duplicateFields.column_name).toMatchObject({ options: { options: [{ label: 'Name', value: 'A' }, { label: 'Age', value: 'B' }] } });
});

async function runRows({ audience, headerRow, overwrite, inputType, values, checkDuplicates = false }: {
  audience: string;
  headerRow: number | undefined;
  overwrite: boolean;
  inputType: string;
  values: unknown;
  checkDuplicates?: boolean;
}) {
  if (audience === 'human') {
    const context = createMockActionContext<typeof insertMultipleRowsAction.props>({ propsValue: {
      includeTeamDrives: false,
      spreadsheetId: 'spreadsheet', sheetId: 0, input_type: inputType,
      values: { values }, overwrite, check_for_duplicate: checkDuplicates,
      check_for_duplicate_column: { column_name: 'A' }, as_string: true, headerRow: headerRow ?? 1,
    } });
    Reflect.set(context.propsValue, 'headerRow', headerRow);
    return insertMultipleRowsAction.run({ ...context, auth: connection });
  }
  const context = createMockActionContext<typeof sheetsAddMultipleRows.props>({ propsValue: {
    spreadsheet_id: 'spreadsheet', sheet_id: 0, input_type: inputType, values: {},
    overwrite, check_for_duplicate: checkDuplicates, duplicate_column: 'A', as_string: true, header_row: headerRow ?? 1,
  } });
  Reflect.set(context.propsValue, 'values', values);
  Reflect.set(context.propsValue, 'header_row', headerRow);
  return sheetsAddMultipleRows.run({ ...context, auth: connection });
}

const connection: Parameters<typeof insertMultipleRowsAction.run>[0]['auth'] = {
  type: AppConnectionType.OAUTH2,
  access_token: 'access-token', refresh_token: 'refresh-token', client_id: 'client',
  client_secret: 'secret', redirect_url: 'http://localhost', token_type: 'Bearer',
  token_url: 'http://localhost/token', scope: '', claimed_at: 0, expires_in: 3600, data: {},
};
