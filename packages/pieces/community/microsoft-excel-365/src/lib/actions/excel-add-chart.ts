import { createAction, Property } from '@activepieces/pieces-framework';
import { WorkbookChart } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getWorksheetPath, requireValue } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelAddChart = createAction({
  auth: excelAuth,
  name: 'excel_add_chart',
  classification: 'WRITE',
  displayName: 'Add Chart',
  description: 'Create a chart on a worksheet from a range of data.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new chart on a worksheet from a source data range in A1 notation (e.g. "A1:C10"). Use to add a chart; use excel_update_chart to rename, move, resize or retitle an existing one. Each call adds another chart, so retries create duplicates.',
    idempotent: false,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
    type: Property.StaticDropdown({
      displayName: 'Chart Type',
      description: 'The kind of chart to create.',
      required: true,
      defaultValue: 'ColumnClustered',
      options: {
        disabled: false,
        options: [
          { label: 'Column (Clustered)', value: 'ColumnClustered' },
          { label: 'Column (Stacked)', value: 'ColumnStacked' },
          { label: 'Column (100% Stacked)', value: 'ColumnStacked100' },
          { label: 'Bar (Clustered)', value: 'BarClustered' },
          { label: 'Bar (Stacked)', value: 'BarStacked' },
          { label: 'Bar (100% Stacked)', value: 'BarStacked100' },
          { label: 'Line', value: 'Line' },
          { label: 'Line with Markers', value: 'LineMarkers' },
          { label: 'Line (Stacked)', value: 'LineStacked' },
          { label: 'Pie', value: 'Pie' },
          { label: 'Doughnut', value: 'Doughnut' },
          { label: 'Area', value: 'Area' },
          { label: 'Area (Stacked)', value: 'AreaStacked' },
          { label: 'Scatter', value: 'XYScatter' },
          { label: 'Scatter with Lines', value: 'XYScatterLines' },
          { label: 'Scatter with Smooth Lines', value: 'XYScatterSmooth' },
          { label: 'Radar', value: 'Radar' },
          { label: 'Bubble', value: 'Bubble' },
        ],
      },
    }),
    sourceData: Property.ShortText({
      displayName: 'Source Data',
      description: 'Range address in A1 notation holding the chart data, including headers, e.g. "A1:C10".',
      required: true,
    }),
    seriesBy: Property.StaticDropdown({
      displayName: 'Series By',
      description: 'Whether each series comes from a row or a column. Auto lets Excel decide.',
      required: false,
      defaultValue: 'Auto',
      options: {
        disabled: false,
        options: [
          { label: 'Auto', value: 'Auto' },
          { label: 'Rows', value: 'Rows' },
          { label: 'Columns', value: 'Columns' },
        ],
      },
    }),
  },
  async run(context) {
    const { type, sourceData, seriesBy } = context.propsValue;
    const chart: WorkbookChart = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getWorksheetPath(context.propsValue)}/charts/add`)
      .post({
        type,
        sourceData: requireValue({ value: sourceData, name: 'Source Data' }),
        seriesBy: seriesBy ?? 'Auto',
      });
    return {
      id: chart.id ?? null,
      name: chart.name ?? null,
      top: chart.top ?? null,
      left: chart.left ?? null,
      height: chart.height ?? null,
      width: chart.width ?? null,
    };
  },
});
