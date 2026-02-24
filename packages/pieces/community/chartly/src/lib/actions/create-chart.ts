import { createAction, Property } from '@activepieces/pieces-framework';
import { chartlyAuth } from '../common/auth';

export const createChartAction = createAction({
  auth: chartlyAuth,
  name: 'create_chart',
  displayName: 'Create Chart',
  description: 'Generates a chart image based on the provided data, configuration, and chart type',
  props: {
    chart_type: Property.StaticDropdown({
      displayName: 'Chart Type',
      description: 'Type of chart to generate',
      required: true,
      options: {
        options: [
          { label: 'Bar Chart', value: 'bar' },
          { label: 'Line Chart', value: 'line' },
          { label: 'Pie Chart', value: 'pie' },
          { label: 'Doughnut Chart', value: 'doughnut' },
          { label: 'Radar Chart', value: 'radar' },
          { label: 'Polar Area Chart', value: 'polarArea' },
          { label: 'Scatter Chart', value: 'scatter' },
          { label: 'Bubble Chart', value: 'bubble' },
        ],
      },
      defaultValue: 'bar',
    }),
    chart_title: Property.ShortText({
      displayName: 'Chart Title',
      description: 'Title for the chart',
      required: false,
    }),
    labels: Property.Array({
      displayName: 'Labels',
      description: 'Labels for the data points (e.g., ["Jan", "Feb", "Mar"])',
      required: true,
    }),
    dataset_label: Property.ShortText({
      displayName: 'Dataset Label',
      description: 'Label for the data series',
      required: true,
      defaultValue: 'Data',
    }),
    data_values: Property.Array({
      displayName: 'Data Values',
      description: 'Numeric values for the chart (e.g., [10, 20, 30])',
      required: true,
    }),
    background_color: Property.ShortText({
      displayName: 'Background Color',
      description: 'Background color for data points (e.g., "rgba(54, 162, 235, 0.8)" or "#36A2EB")',
      required: false,
      defaultValue: 'rgba(54, 162, 235, 0.8)',
    }),
    width: Property.Number({
      displayName: 'Width',
      description: 'Image width in pixels (1-2000)',
      required: true,
      defaultValue: 600,
    }),
    height: Property.Number({
      displayName: 'Height',
      description: 'Image height in pixels (1-2000)',
      required: true,
      defaultValue: 400,
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'Output format for the chart image',
      required: true,
      options: {
        options: [
          { label: 'PNG', value: 'png' },
          { label: 'SVG', value: 'svg' },
        ],
      },
      defaultValue: 'png',
    }),
    background_color_image: Property.ShortText({
      displayName: 'Image Background Color',
      description: 'Background color for the image (e.g., "white", "transparent", "#FFFFFF")',
      required: false,
      defaultValue: 'white',
    }),
    advanced_config: Property.LongText({
      displayName: 'Advanced Chart.js Configuration',
      description: 'Complete Chart.js configuration as JSON (overrides other settings)',
      required: false,
    }),
  },
  async run(context) {
    const {
      chart_type,
      chart_title,
      labels,
      dataset_label,
      data_values,
      background_color,
      width,
      height,
      format,
      background_color_image,
      advanced_config,
    } = context.propsValue;

    let chartConfig: any;

    if (advanced_config) {
      try {
        chartConfig = JSON.parse(advanced_config);
      } catch (error) {
        throw new Error('Invalid JSON in advanced configuration');
      }
    } else {
      chartConfig = {
        type: chart_type,
        data: {
          labels: labels,
          datasets: [{
            label: dataset_label,
            data: data_values,
            backgroundColor: background_color,
          }],
        },
        options: {
          responsive: false,
        },
      };

      if (chart_title) {
        chartConfig.options.plugins = {
          title: {
            display: true,
            text: chart_title,
          },
        };
      }
    }

    const requestBody: any = {
      chart: chartConfig,
      width,
      height,
      format,
    };

    if (background_color_image) {
      requestBody.backgroundColor = background_color_image;
    }

    const response = await fetch('https://api.chartly.dev/v1/chart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': context.auth.secret_text,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chartly API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Get the image data as base64
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:image/${format};base64,${base64Image}`;

    return {
      success: true,
      chart_url: dataUrl,
      format,
      width,
      height,
      chart_config: chartConfig,
    };
  },
});
