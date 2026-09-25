import { createAction, Property } from '@activepieces/pieces-framework';
import { WorkbookRange } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getRangeSegment, getWorksheetPath, parseCellAddress, parseValues } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelUpdateRange = createAction({
  auth: excelAuth,
  name: 'excel_update_range',
  classification: 'WRITE',
  displayName: 'Update Range',
  description: 'Write values, formulas or number formats into a cell range.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Overwrite the values, formulas and/or number formats of an exact A1 range with 2-D arrays whose dimensions match the range (e.g. "A1:B2" takes 2 rows of 2 cells). Use excel_append_rows to add rows below existing data without computing an address, or excel_add_table_rows for a defined table. At least one of the three arrays is required; safe to retry with the same input.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
    address: excelAiProps.address,
    values: Property.Json({
      displayName: 'Values',
      description: '2-D array of cell values, one inner array per row, e.g. [["Name","Age"],["Ada",36]]. Use null to leave a cell unchanged.',
      required: false,
    }),
    formulas: Property.Json({
      displayName: 'Formulas',
      description: '2-D array of formulas, e.g. [["=SUM(A1:A10)"]].',
      required: false,
    }),
    numberFormat: Property.Json({
      displayName: 'Number Format',
      description: '2-D array of Excel number format codes, e.g. [["0.00","yyyy-mm-dd"]].',
      required: false,
    }),
  },
  async run(context) {
    const { values, formulas, numberFormat, address } = context.propsValue;
    const body = {
      ...(isProvided(values) ? { values: parseValues({ values, name: 'Values' }) } : {}),
      ...(isProvided(formulas) ? { formulas: parseValues({ values: formulas, name: 'Formulas' }) } : {}),
      ...(isProvided(numberFormat) ? { numberFormat: parseValues({ values: numberFormat, name: 'Number Format' }) } : {}),
    };
    const arrays = Object.values(body);
    if (arrays.length === 0) {
      throw new Error('Provide at least one of values, formulas or numberFormat.');
    }
    const expected = rangeDimensions({ address });
    arrays.forEach((grid) => {
      const rows = grid.length;
      const columns = grid[0].length;
      if (expected && (expected.rows !== rows || expected.columns !== columns)) {
        throw new Error(`Range ${address} is ${expected.rows}x${expected.columns} but an array is ${rows}x${columns}. Adjust the address or the array.`);
      }
      if (rows !== arrays[0].length || columns !== arrays[0][0].length) {
        throw new Error('Values, formulas and numberFormat must all have the same dimensions.');
      }
    });
    const range: WorkbookRange = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getWorksheetPath(context.propsValue)}/${getRangeSegment({ address })}`)
      .patch(body);
    return {
      address: range.address ?? null,
      rowCount: range.rowCount ?? null,
      columnCount: range.columnCount ?? null,
      values: range.values ?? null,
      formulas: range.formulas ?? null,
      numberFormat: range.numberFormat ?? null,
    };
  },
});

function isProvided(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

function rangeDimensions({ address }: { address: string }): { rows: number; columns: number } | null {
  const local = address.trim().split('!').pop() ?? '';
  const [first, last = first] = local.split(':');
  const start = parseCellAddress({ cell: first });
  const end = parseCellAddress({ cell: last });
  if (!start || !end) {
    return null;
  }
  return {
    rows: Math.abs(end.row - start.row) + 1,
    columns: Math.abs(end.column - start.column) + 1,
  };
}
