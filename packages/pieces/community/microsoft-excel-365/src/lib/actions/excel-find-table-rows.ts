import { createAction, Property } from '@activepieces/pieces-framework';
import { WorkbookTableColumn, WorkbookTableRow } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getFirstRowValues, getTablePath, requireValue } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelFindTableRows = createAction({
  auth: excelAuth,
  name: 'excel_find_table_rows',
  classification: 'SEARCH',
  displayName: 'Find Table Rows',
  description: 'Find table rows whose value in a column matches a search value.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Find the data rows of a table whose cell in a named column equals (or contains) a value, returned as objects keyed by header with their 0-based row index. Use this rather than excel_list_table_rows when looking up records by a key; it never applies a filter to the table. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    table: excelAiProps.table,
    column: Property.ShortText({
      displayName: 'Column',
      description: 'Header name of the column to search. Resolve via excel_list_table_columns.',
      required: true,
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description: 'Value to look for in the column.',
      required: true,
    }),
    match_mode: Property.StaticDropdown({
      displayName: 'Match Mode',
      description: 'Whether the cell must equal the value or only contain it.',
      required: false,
      defaultValue: 'exact',
      options: {
        disabled: false,
        options: [
          { label: 'Exact', value: 'exact' },
          { label: 'Contains', value: 'contains' },
        ],
      },
    }),
    case_sensitive: Property.Checkbox({
      displayName: 'Case Sensitive',
      description: 'Match letter case exactly. Off by default.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { column, value, match_mode, case_sensitive } = context.propsValue;
    const client = createMSGraphClientFromAuth({ auth: context.auth });
    const tablePath = getTablePath(context.propsValue);
    const columnsResponse: TableColumnListResponse = await client.api(`${tablePath}/columns`).select('name,index').get();
    const rowsResponse: TableRowListResponse = await client.api(`${tablePath}/rows`).get();
    const headers = (columnsResponse.value ?? []).map((tableColumn) => tableColumn.name ?? '');
    const columnName = requireValue({ value: column, name: 'Column' });
    const exactIndex = headers.indexOf(columnName);
    const columnIndex = exactIndex !== -1
      ? exactIndex
      : headers.findIndex((header) => header.toLowerCase() === columnName.toLowerCase());
    if (columnIndex === -1) {
      throw new Error(`Column "${columnName}" not found in the table. Available columns: ${headers.join(', ')}.`);
    }
    const needle = normalize({ text: value, caseSensitive: case_sensitive === true });
    const matches = (rowsResponse.value ?? [])
      .map((row, position) => ({ rowIndex: row.index ?? position, cells: getFirstRowValues({ values: row.values }) }))
      .filter(({ cells }) => {
        const cell = normalize({ text: cellText({ cell: cells[columnIndex] }), caseSensitive: case_sensitive === true });
        return match_mode === 'contains' ? cell.includes(needle) : cell === needle;
      })
      .map(({ rowIndex, cells }) => ({
        ...Object.fromEntries(headers.map((header, i) => [header, cells[i] ?? null])),
        row_index: rowIndex,
      }));
    return { matches, count: matches.length };
  },
});

function cellText({ cell }: { cell: unknown }): string {
  if (cell === null || cell === undefined) {
    return '';
  }
  return String(cell);
}

function normalize({ text, caseSensitive }: { text: string; caseSensitive: boolean }): string {
  const trimmed = text.trim();
  return caseSensitive ? trimmed : trimmed.toLowerCase();
}

type TableColumnListResponse = {
  value?: WorkbookTableColumn[];
};

type TableRowListResponse = {
  value?: WorkbookTableRow[];
};
