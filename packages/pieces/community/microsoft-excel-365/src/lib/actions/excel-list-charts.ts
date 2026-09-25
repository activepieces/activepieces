import { createAction } from '@activepieces/pieces-framework';
import { WorkbookChart } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getWorksheetPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelListCharts = createAction({
  auth: excelAuth,
  name: 'excel_list_charts',
  classification: 'READ',
  displayName: 'List Charts',
  description: 'List the charts on a worksheet.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List every chart on one worksheet with its id, name, position and size. Use to resolve a chart name or ID before excel_update_chart, excel_list_chart_series, excel_get_chart_axis, excel_get_chart_legend or excel_get_chart_data_labels. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
  },
  async run(context) {
    const response: ChartListResponse = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getWorksheetPath(context.propsValue)}/charts`)
      .get();
    const charts = (response.value ?? []).map((chart) => ({
      id: chart.id ?? null,
      name: chart.name ?? null,
      top: chart.top ?? null,
      left: chart.left ?? null,
      height: chart.height ?? null,
      width: chart.width ?? null,
    }));
    return { charts, count: charts.length };
  },
});

type ChartListResponse = {
  value?: WorkbookChart[];
};
