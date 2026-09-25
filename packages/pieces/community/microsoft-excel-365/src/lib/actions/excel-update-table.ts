import { createAction, Property } from '@activepieces/pieces-framework';
import { WorkbookTable } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getTablePath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelUpdateTable = createAction({
  auth: excelAuth,
  name: 'excel_update_table',
  classification: 'WRITE',
  displayName: 'Update Table',
  description: 'Rename a table or change its style, header row or totals row.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Change a table\'s name, style, header-row or totals-row visibility; only the fields you set are changed. Use excel_add_table_column / excel_add_table_rows to change its shape instead. At least one field is required; re-applying the same values is safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    table: excelAiProps.table,
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'New table name. No spaces; must be unique in the workbook.',
      required: false,
    }),
    style: Property.ShortText({
      displayName: 'Style',
      description: 'Table style name, e.g. "TableStyleMedium2" or "TableStyleLight9".',
      required: false,
    }),
    show_headers: excelAiProps.booleanDropdown({ displayName: 'Show Header Row', description: 'Leave unset to keep the table\'s current value.' }),
    show_totals: excelAiProps.booleanDropdown({ displayName: 'Show Totals Row', description: 'Leave unset to keep the table\'s current value.' }),
  },
  async run(context) {
    const { name, style, show_headers, show_totals } = context.propsValue;
    const trimmedName = name?.trim();
    const trimmedStyle = style?.trim();
    const body = {
      ...(trimmedName ? { name: trimmedName } : {}),
      ...(trimmedStyle ? { style: trimmedStyle } : {}),
      ...(show_headers !== undefined && show_headers !== null ? { showHeaders: show_headers } : {}),
      ...(show_totals !== undefined && show_totals !== null ? { showTotals: show_totals } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one of New Name, Style, Show Header Row or Show Totals Row.');
    }
    const table: WorkbookTable = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(getTablePath(context.propsValue))
      .patch(body);
    return {
      id: table.id ?? null,
      name: table.name ?? null,
      style: table.style ?? null,
      showHeaders: table.showHeaders ?? null,
      showTotals: table.showTotals ?? null,
    };
  },
});
