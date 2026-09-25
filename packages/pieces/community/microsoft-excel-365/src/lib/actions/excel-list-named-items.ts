import { createAction } from '@activepieces/pieces-framework';
import { WorkbookNamedItem } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getWorkbookPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelListNamedItems = createAction({
  auth: excelAuth,
  name: 'excel_list_named_items',
  classification: 'SEARCH',
  displayName: 'List Named Items',
  description: 'List the defined names (named ranges and constants) of a workbook.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the workbook-scoped defined names (named ranges, constants, formulas) with what each refers to. Use to discover named ranges before reading them with excel_get_range; use excel_get_workbook with Include Structure for just the names alongside sheets and tables. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
  },
  async run(context) {
    const response: { value?: WorkbookNamedItem[] } = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getWorkbookPath(context.propsValue)}/names`)
      .get();
    const namedItems = (response.value ?? []).map((item) => ({
      name: item.name ?? null,
      type: item.type ?? null,
      value: toText({ value: item.value }),
      visible: item.visible ?? null,
      comment: item.comment ?? null,
    }));
    return { namedItems, count: namedItems.length };
  },
});

function toText({ value }: { value: unknown }): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  return typeof value === 'string' ? value : JSON.stringify(value);
}
