import { createAction } from '@activepieces/pieces-framework';
import { WorkbookRange } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getRangeSegment, getWorksheetPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelGetRange = createAction({
  auth: excelAuth,
  name: 'excel_get_range',
  classification: 'READ',
  displayName: 'Get Range',
  description: 'Read the values, formulas and number formats of a cell range.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read the values, formulas and number formats of a specific A1 range (e.g. "A1:D20") on a worksheet. Use excel_get_used_range to read a whole sheet without knowing its extent, or excel_list_table_rows for data in a defined table. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
    address: excelAiProps.address,
  },
  async run(context) {
    const range: WorkbookRange = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getWorksheetPath(context.propsValue)}/${getRangeSegment(context.propsValue)}`)
      .get();
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
