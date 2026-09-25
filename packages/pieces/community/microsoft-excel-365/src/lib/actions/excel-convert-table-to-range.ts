import { createAction } from '@activepieces/pieces-framework';
import { WorkbookRange } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getTablePath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelConvertTableToRange = createAction({
  auth: excelAuth,
  name: 'excel_convert_table_to_range',
  classification: 'WRITE',
  displayName: 'Convert Table to Range',
  description: 'Convert a table back into a plain cell range, keeping its data.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Remove the table structure from a table while keeping its cells and values, the inverse of excel_create_table. Afterwards the data is only addressable by A1 range, not by the excel_*_table_* atomics. Not safe to retry: the table no longer exists after the first call.',
    idempotent: false,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    table: excelAiProps.table,
  },
  async run(context) {
    const range: WorkbookRange = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getTablePath(context.propsValue)}/convertToRange`)
      .post({});
    return {
      address: range.address ?? null,
      rowCount: range.rowCount ?? null,
      columnCount: range.columnCount ?? null,
    };
  },
});
