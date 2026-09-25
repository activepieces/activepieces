import { createAction } from '@activepieces/pieces-framework';
import { WorkbookChartDataLabels } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getChartPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelGetChartDataLabels = createAction({
  auth: excelAuth,
  name: 'excel_get_chart_data_labels',
  classification: 'READ',
  displayName: 'Get Chart Data Labels',
  description: 'Get the data label settings of a chart.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read a chart\'s data label settings: position, separator and which parts (value, category, series name, percentage, legend key, bubble size) are shown. Use excel_get_chart_legend or excel_get_chart_axis for other chart parts. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
    chart: excelAiProps.chart,
  },
  async run(context) {
    const labels: WorkbookChartDataLabels = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getChartPath(context.propsValue)}/dataLabels`)
      .get();
    return {
      position: labels.position ?? null,
      separator: labels.separator ?? null,
      showBubbleSize: labels.showBubbleSize ?? null,
      showCategoryName: labels.showCategoryName ?? null,
      showLegendKey: labels.showLegendKey ?? null,
      showPercentage: labels.showPercentage ?? null,
      showSeriesName: labels.showSeriesName ?? null,
      showValue: labels.showValue ?? null,
    };
  },
});
