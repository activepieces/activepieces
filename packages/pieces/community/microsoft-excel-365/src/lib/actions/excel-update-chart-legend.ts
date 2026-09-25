import { createAction, Property } from '@activepieces/pieces-framework';
import { WorkbookChartLegend } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getChartPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelUpdateChartLegend = createAction({
  auth: excelAuth,
  name: 'excel_update_chart_legend',
  classification: 'WRITE',
  displayName: 'Update Chart Legend',
  description: 'Show, hide or reposition a chart legend.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Change a chart legend\'s visibility, position and/or overlay; only the fields you provide are changed and at least one is required. Use excel_get_chart_legend to read the current state and excel_update_chart for the chart title, name or size. Re-applying the same values is safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
    chart: excelAiProps.chart,
    visible: excelAiProps.booleanDropdown({
      displayName: 'Visible',
      description: 'Show or hide the legend. Leave unset to keep the current setting.',
    }),
    position: Property.StaticDropdown({
      displayName: 'Position',
      description: 'Where to place the legend. Leave unset to keep the current position.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Top', value: 'Top' },
          { label: 'Bottom', value: 'Bottom' },
          { label: 'Left', value: 'Left' },
          { label: 'Right', value: 'Right' },
          { label: 'Corner', value: 'Corner' },
          { label: 'Custom', value: 'Custom' },
        ],
      },
    }),
    overlay: excelAiProps.booleanDropdown({
      displayName: 'Overlay',
      description: 'Whether the legend may overlap the plot area. Leave unset to keep the current setting.',
    }),
  },
  async run(context) {
    const { visible, position, overlay } = context.propsValue;
    const updates = {
      ...(isProvided(visible) ? { visible } : {}),
      ...(isProvided(position) && position !== '' ? { position } : {}),
      ...(isProvided(overlay) ? { overlay } : {}),
    };
    if (Object.keys(updates).length === 0) {
      throw new Error('Provide at least one field to update: visible, position or overlay.');
    }
    const legend: WorkbookChartLegend = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getChartPath(context.propsValue)}/legend`)
      .patch(updates);
    return {
      visible: legend.visible ?? null,
      position: legend.position ?? null,
      overlay: legend.overlay ?? null,
    };
  },
});

function isProvided<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null;
}
