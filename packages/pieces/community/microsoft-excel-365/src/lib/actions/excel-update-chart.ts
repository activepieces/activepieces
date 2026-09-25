import { createAction, Property } from '@activepieces/pieces-framework';
import { WorkbookChart, WorkbookChartTitle } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getChartPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelUpdateChart = createAction({
  auth: excelAuth,
  name: 'excel_update_chart',
  classification: 'WRITE',
  displayName: 'Update Chart',
  description: 'Rename, move, resize or retitle a chart.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Change an existing chart\'s name, position (top/left), size (height/width) and/or title text and visibility; only the fields you provide are changed and at least one is required. Use excel_update_chart_legend for the legend and excel_add_chart to create a chart. Re-applying the same values is safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
    chart: excelAiProps.chart,
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'New chart name. Leave empty to keep the current name.',
      required: false,
    }),
    top: Property.Number({
      displayName: 'Top',
      description: 'Distance in points from the top edge of the worksheet.',
      required: false,
    }),
    left: Property.Number({
      displayName: 'Left',
      description: 'Distance in points from the left edge of the worksheet.',
      required: false,
    }),
    height: Property.Number({
      displayName: 'Height',
      description: 'Chart height in points.',
      required: false,
    }),
    width: Property.Number({
      displayName: 'Width',
      description: 'Chart width in points.',
      required: false,
    }),
    titleText: Property.ShortText({
      displayName: 'Title Text',
      description: 'New chart title text.',
      required: false,
    }),
    titleVisible: excelAiProps.booleanDropdown({
      displayName: 'Title Visible',
      description: 'Show or hide the chart title. Leave unset to keep the current setting.',
    }),
  },
  async run(context) {
    const { name, top, left, height, width, titleText, titleVisible } = context.propsValue;
    const chartUpdates = {
      ...(isProvided(name) && name.trim() !== '' ? { name: name.trim() } : {}),
      ...(isProvided(top) ? { top } : {}),
      ...(isProvided(left) ? { left } : {}),
      ...(isProvided(height) ? { height } : {}),
      ...(isProvided(width) ? { width } : {}),
    };
    const titleUpdates = {
      ...(isProvided(titleText) && titleText !== '' ? { text: titleText } : {}),
      ...(isProvided(titleVisible) ? { visible: titleVisible } : {}),
    };
    const hasChartUpdates = Object.keys(chartUpdates).length > 0;
    const hasTitleUpdates = Object.keys(titleUpdates).length > 0;
    if (!hasChartUpdates && !hasTitleUpdates) {
      throw new Error('Provide at least one field to update: name, top, left, height, width, title text or title visible.');
    }
    const client = createMSGraphClientFromAuth({ auth: context.auth });
    const chartPath = getChartPath(context.propsValue);
    const title: WorkbookChartTitle = hasTitleUpdates
      ? await client.api(`${chartPath}/title`).patch(titleUpdates)
      : await client.api(`${chartPath}/title`).get();
    const chart: WorkbookChart = hasChartUpdates
      ? await client.api(chartPath).patch(chartUpdates)
      : await client.api(chartPath).get();
    return {
      id: chart.id ?? null,
      name: chart.name ?? null,
      top: chart.top ?? null,
      left: chart.left ?? null,
      height: chart.height ?? null,
      width: chart.width ?? null,
      titleText: title.text ?? null,
      titleVisible: title.visible ?? null,
    };
  },
});

function isProvided<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null;
}
