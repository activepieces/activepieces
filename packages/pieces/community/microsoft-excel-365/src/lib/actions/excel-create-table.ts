import { createAction, Property } from '@activepieces/pieces-framework';
import { WorkbookTable } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getWorksheetPath, requireValue } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelCreateTable = createAction({
  auth: excelAuth,
  name: 'excel_create_table',
  classification: 'WRITE',
  displayName: 'Create Table',
  description: 'Convert a cell range on a worksheet into a table.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Turn an A1 range on a worksheet into a structured table so the excel_*_table_* atomics can target it by name. Use excel_list_tables first to check whether a table already covers the range; ranges cannot overlap an existing table. Each call creates a new table, so retries fail or duplicate.',
    idempotent: false,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
    address: excelAiProps.address,
    has_headers: Property.Checkbox({
      displayName: 'Has Headers',
      description: 'Whether the first row of the range holds column names. If off, Excel inserts a header row above the range.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { address, has_headers } = context.propsValue;
    const table: WorkbookTable = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getWorksheetPath(context.propsValue)}/tables/add`)
      .post({
        address: requireValue({ value: address, name: 'Range address' }),
        hasHeaders: has_headers !== false,
      });
    return {
      id: table.id ?? null,
      name: table.name ?? null,
      style: table.style ?? null,
      showHeaders: table.showHeaders ?? null,
    };
  },
});
