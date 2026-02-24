import { instaChartsAuth } from '../../index';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';

export const instaChartsGenerateChartImageAction = createAction({
  auth: instaChartsAuth,
  name: 'generate_chart_image',
  displayName: 'Generate Chart Image',
  description: 'Generates a temporary chart image using customizable templates and data parameters',
  props: {
    templateId: Property.Dropdown({
      displayName: 'Template',
      description: 'Select a chart template to use',
      required: true,
      auth: instaChartsAuth,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }

        try {
          const response = await fetch('https://api.instacharts.io/v1/templates', {
            headers: {
              'Authorization': `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch templates: ${response.statusText}`);
          }

          const data = await response.json();
          
          return {
            options: data.data.map((template: any) => ({
              label: `${template.name} (${template.type})`,
              value: template.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load templates',
          };
        }
      },
    }),
    chartType: Property.StaticDropdown({
      displayName: 'Chart Type',
      description: 'Type of chart to generate',
      required: false,
      defaultValue: 'stackedBar',
      options: {
        options: [
          { label: 'Bar Chart', value: 'bar' },
          { label: 'Stacked Bar Chart', value: 'stackedBar' },
          { label: 'Grouped Bar Chart', value: 'groupedBar' },
          { label: 'Line Chart', value: 'line' },
          { label: 'Grouped Line Chart', value: 'groupedLine' },
          { label: 'Scatter Chart', value: 'scatter' },
          { label: 'Grouped Scatter Chart', value: 'groupedScatter' },
          { label: 'Area Chart', value: 'area' },
          { label: 'Grouped Area Chart', value: 'groupedArea' },
          { label: 'Pie Chart', value: 'pie' },
          { label: 'Radar Chart', value: 'radar' },
        ],
      },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Main chart title',
      required: false,
    }),
    subtitle: Property.ShortText({
      displayName: 'Subtitle',
      description: 'Secondary chart title',
      required: false,
    }),
    xTitle: Property.ShortText({
      displayName: 'X-Axis Title',
      description: 'Title for the X-axis',
      required: false,
    }),
    yTitle: Property.ShortText({
      displayName: 'Y-Axis Title',
      description: 'Title for the Y-axis',
      required: false,
    }),
    zTitle: Property.ShortText({
      displayName: 'Legend Title',
      description: 'Title for the legend',
      required: false,
    }),
    x: Property.Array({
      displayName: 'X-Axis Data',
      description: 'X-axis data values (e.g., ["Mobile", "Desktop", "Tablet"])',
      required: true,
    }),
    y: Property.Array({
      displayName: 'Y-Axis Data',
      description: 'Y-axis data values (e.g., [100, 200, 400])',
      required: true,
    }),
    z: Property.Array({
      displayName: 'Breakdown Data',
      description: 'Breakdown axis data for unaggregated charts (e.g., ["Site A", "Site A", "Site B"])',
      required: false,
    }),
    series: Property.Array({
      displayName: 'Series Data',
      description: 'Series data as objects with label and data (e.g., [{"label":"Site A","data":[1,2,3]}])',
      required: false,
    }),
    dLabel: Property.Checkbox({
      displayName: 'Show Data Labels',
      description: 'Show data labels near the chart pieces',
      required: false,
      defaultValue: false,
    }),
    overrides: Property.ShortText({
      displayName: 'Override Parameters',
      description: 'Additional query parameters (e.g., color=cccccc&width=500)',
      required: false,
    }),
  },
  async run(context) {
    const { auth } = context;
    const accessToken = (auth as OAuth2PropertyValue).access_token;

    const requestBody: any = {
      templateId: context.propsValue.templateId,
    };

    if (context.propsValue.chartType) requestBody.chartType = context.propsValue.chartType;
    if (context.propsValue.title) requestBody.title = context.propsValue.title;
    if (context.propsValue.subtitle) requestBody.subtitle = context.propsValue.subtitle;
    if (context.propsValue.xTitle) requestBody.xTitle = context.propsValue.xTitle;
    if (context.propsValue.yTitle) requestBody.yTitle = context.propsValue.yTitle;
    if (context.propsValue.zTitle) requestBody.zTitle = context.propsValue.zTitle;
    if (context.propsValue.x) requestBody.x = context.propsValue.x;
    if (context.propsValue.y) requestBody.y = context.propsValue.y;
    if (context.propsValue.z) requestBody.z = context.propsValue.z;
    if (context.propsValue.series) requestBody.series = context.propsValue.series;
    if (context.propsValue.dLabel !== undefined) requestBody.dLabel = context.propsValue.dLabel;
    if (context.propsValue.overrides) requestBody.overrides = context.propsValue.overrides;

    const response = await fetch('https://api.instacharts.io/v1/generate/image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to generate chart: ${response.status} ${response.statusText}. ${errorData.message || ''}`);
    }

    const imageBuffer = await response.arrayBuffer();
    
    return context.files.write({
      data: Buffer.from(imageBuffer),
      fileName: 'chart.png',
    });
  },
});
