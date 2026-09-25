import { createAction } from '@activepieces/pieces-framework';
import { WorkbookChartSeries } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getChartPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelListChartSeries = createAction({
  auth: excelAuth,
  name: 'excel_list_chart_series',
  classification: 'READ',
  displayName: 'List Chart Series',
  description: 'List the data series of a chart.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the names of the data series plotted in one chart, in order. Use to inspect what a chart shows; use excel_list_charts to find the chart first. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
    chart: excelAiProps.chart,
  },
  async run(context) {
    const response: ChartSeriesListResponse = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getChartPath(context.propsValue)}/series`)
      .get();
    const series = (response.value ?? []).map((item) => ({
      name: item.name ?? null,
    }));
    return { series, count: series.length };
  },
});

type ChartSeriesListResponse = {
  value?: WorkbookChartSeries[];
};
