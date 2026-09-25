import { createAction, Property } from '@activepieces/pieces-framework';
import { WorkbookChartAxis } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getChartPath, requireValue } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelGetChartAxis = createAction({
  auth: excelAuth,
  name: 'excel_get_chart_axis',
  classification: 'READ',
  displayName: 'Get Chart Axis',
  description: 'Get the scale settings of a chart axis.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read one chart axis (category, value or series) and return its minimum, maximum, major unit and minor unit. Use to inspect a chart\'s scale; use excel_get_chart_legend or excel_get_chart_data_labels for other chart parts. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
    chart: excelAiProps.chart,
    axis: Property.StaticDropdown({
      displayName: 'Axis',
      description: 'Which axis to read. Series axis exists only on 3-D charts.',
      required: true,
      defaultValue: 'valueAxis',
      options: {
        disabled: false,
        options: [
          { label: 'Category Axis', value: 'categoryAxis' },
          { label: 'Value Axis', value: 'valueAxis' },
          { label: 'Series Axis', value: 'seriesAxis' },
        ],
      },
    }),
  },
  async run(context) {
    const axisName = requireValue({ value: context.propsValue.axis, name: 'Axis' });
    const axis: WorkbookChartAxis = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getChartPath(context.propsValue)}/axes/${encodeURIComponent(axisName)}`)
      .get();
    return {
      axis: axisName,
      minimum: axis.minimum ?? null,
      maximum: axis.maximum ?? null,
      majorUnit: axis.majorUnit ?? null,
      minorUnit: axis.minorUnit ?? null,
    };
  },
});
