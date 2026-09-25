import { createAction, Property } from '@activepieces/pieces-framework';
import { WorkbookRange } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { CellPosition, createMSGraphClientFromAuth, getRangeSegment, getWorksheetPath, parseCellAddress, parseJsonInput, parseValues } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';
import { numberToColumnName } from '../common/helpers';

export const excelAppendRows = createAction({
  auth: excelAuth,
  name: 'excel_append_rows',
  classification: 'WRITE',
  displayName: 'Append Rows',
  description: 'Append rows below the last used row of a worksheet.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Append one or more rows directly below the last used row of a plain worksheet, aligned to the used range\'s first column; pass a 2-D array or objects keyed by the header names in row 1. Use excel_add_table_rows for a defined table and excel_update_range to overwrite a known address. Not idempotent: a retry appends the rows again.',
    idempotent: false,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
    values: Property.Json({
      displayName: 'Rows',
      description: 'Either a 2-D array, e.g. [["Ada",36],["Alan",41]], or an array of objects keyed by header names from row 1, e.g. [{"Name":"Ada","Age":36}].',
      required: true,
    }),
  },
  async run(context) {
    const client = createMSGraphClientFromAuth({ auth: context.auth });
    const sheetPath = getWorksheetPath(context.propsValue);
    const used: WorkbookRange = await client.api(`${sheetPath}/usedRange(valuesOnly=true)`).get();
    const usedValues: unknown[][] = Array.isArray(used.values) ? used.values : [];
    const bounds = parseUsedAddress({ address: used.address ?? '' });
    const empty = isEmptySheet({ values: usedValues });
    const rows = toRows({ input: context.propsValue.values, headerRow: empty ? [] : usedValues[0] ?? [] });
    const startRow = empty ? 1 : bounds.endRow + 1;
    const startColumn = empty ? 1 : bounds.startColumn;
    const address = `${numberToColumnName(startColumn)}${startRow}:${numberToColumnName(startColumn + rows[0].length - 1)}${startRow + rows.length - 1}`;
    const written: WorkbookRange = await client
      .api(`${sheetPath}/${getRangeSegment({ address })}`)
      .patch({ values: rows });
    return {
      address: written.address ?? address,
      rowCount: written.rowCount ?? rows.length,
      columnCount: written.columnCount ?? rows[0].length,
    };
  },
});

function toRows({ input, headerRow }: { input: unknown; headerRow: unknown[] }): unknown[][] {
  const parsed: unknown = parseJsonInput({ value: input, name: 'Rows' });
  if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((row) => isRecord(row))) {
    return objectsToRows({ objects: parsed.filter(isRecord), headerRow });
  }
  return parseValues({ values: parsed, name: 'Rows' });
}

function objectsToRows({ objects, headerRow }: { objects: Record<string, unknown>[]; headerRow: unknown[] }): unknown[][] {
  const headers = headerRow.map((cell) => (cell === null || cell === undefined ? '' : String(cell).trim()));
  const validHeaders = headers.filter((header) => header !== '');
  if (validHeaders.length === 0) {
    throw new Error('The worksheet has no header row in its first used row; pass Rows as a 2-D array instead.');
  }
  const unknownKeys = [...new Set(objects.flatMap((row) => Object.keys(row)))].filter((key) => !validHeaders.includes(key.trim()));
  if (unknownKeys.length > 0) {
    throw new Error(`Unknown column(s): ${unknownKeys.join(', ')}. Valid headers: ${validHeaders.join(', ')}.`);
  }
  return objects.map((row) => {
    const trimmed = new Map(Object.entries(row).map(([key, value]) => [key.trim(), value]));
    return headers.map((header) => {
      const value = header === '' ? undefined : trimmed.get(header);
      return value === undefined || value === null ? '' : value;
    });
  });
}

function parseUsedAddress({ address }: { address: string }): { startColumn: number; endRow: number } {
  const local = address.split('!').pop() ?? '';
  const [first, last = first] = local.split(':');
  const start = requireCell({ cell: first });
  const end = requireCell({ cell: last });
  return { startColumn: start.column, endRow: end.row };
}

function isEmptySheet({ values }: { values: unknown[][] }): boolean {
  return values.every((row) => row.every((cell) => cell === '' || cell === null || cell === undefined));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireCell({ cell }: { cell: string }): CellPosition {
  const position = parseCellAddress({ cell });
  if (!position) {
    throw new Error(`Could not parse the worksheet used range address "${cell}".`);
  }
  return position;
}
