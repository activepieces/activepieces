import { createAction } from '@activepieces/pieces-framework';
import { WorkbookChartLegend } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getChartPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelGetChartLegend = createAction({
  auth: excelAuth,
  name: 'excel_get_chart_legend',
  classification: 'READ',
  displayName: 'Get Chart Legend',
  description: 'Get the legend settings of a chart.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read a chart\'s legend settings: whether it is visible, its position and whether it overlays the plot. Use before excel_update_chart_legend to see the current state. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
    chart: excelAiProps.chart,
  },
  async run(context) {
    const legend: WorkbookChartLegend = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getChartPath(context.propsValue)}/legend`)
      .get();
    return {
      visible: legend.visible ?? null,
      position: legend.position ?? null,
      overlay: legend.overlay ?? null,
    };
  },
});
