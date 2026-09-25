import { createAction, Property } from '@activepieces/pieces-framework';
import { WorkbookRange } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getWorksheetPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelGetUsedRange = createAction({
  auth: excelAuth,
  name: 'excel_get_used_range',
  classification: 'READ',
  displayName: 'Get Used Range',
  description: 'Read all data on a worksheet (the smallest range containing values).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read every value on a worksheet by returning its used range (the smallest block containing values) and its address; optionally also return rows as objects keyed by the first row\'s headers. Use this to read a whole sheet; use excel_get_range for a known sub-range or formulas. An empty sheet returns address A1 with [[""]]. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
    firstRowIsHeader: Property.Checkbox({
      displayName: 'First Row Is Header',
      description: 'Also return data rows as objects keyed by the values in the first row.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const range: WorkbookRange = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getWorksheetPath(context.propsValue)}/usedRange(valuesOnly=true)`)
      .get();
    const values: unknown[][] = Array.isArray(range.values) ? range.values : [];
    const result = {
      address: range.address ?? null,
      rowCount: range.rowCount ?? null,
      columnCount: range.columnCount ?? null,
      values,
    };
    if (!context.propsValue.firstRowIsHeader) {
      return result;
    }
    const rows = rowsAsObjects({ values });
    return { ...result, rows, count: rows.length };
  },
});

function rowsAsObjects({ values }: { values: unknown[][] }): Record<string, unknown>[] {
  const [headerRow = [], ...dataRows] = values;
  const headers = headerRow.map((cell, index) => {
    const text = cell === null || cell === undefined ? '' : String(cell).trim();
    return text === '' ? `Column ${index + 1}` : text;
  });
  return dataRows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null])));
}
