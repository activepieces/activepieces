import { createAction, Property } from '@activepieces/pieces-framework';
import { chartlyAuth } from '../common/auth';

export const getChartAction = createAction({
  auth: chartlyAuth,
  name: 'get_chart',
  displayName: 'Get Chart',
  description: 'Retrieve a previously created chart by its ID. Returns cached image data optimized for sharing.',
  props: {
    chart_id: Property.ShortText({
      displayName: 'Chart ID',
      description: 'The ID of the chart to retrieve (from create chart response)',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Expected Format',
      description: 'Expected output format of the chart',
      required: false,
      options: {
        options: [
          { label: 'PNG', value: 'png' },
          { label: 'SVG', value: 'svg' },
          { label: 'Auto-detect', value: 'auto' },
        ],
      },
      defaultValue: 'auto',
    }),
  },
  async run(context) {
    const { chart_id, format } = context.propsValue;

    if (!chart_id || chart_id.trim() === '') {
      throw new Error('Chart ID is required');
    }

    const response = await fetch(`https://api.chartly.dev/v1/chart/${chart_id.trim()}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': context.auth.secret_text,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Chart with ID '${chart_id}' not found. Please verify the chart ID is correct.`);
      } else {
        const errorText = await response.text();
        throw new Error(`Chartly API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
    }

    // Get the content type to determine format
    const contentType = response.headers.get('content-type') || '';
    let detectedFormat = 'png';

    if (contentType.includes('svg')) {
      detectedFormat = 'svg';
    } else if (contentType.includes('png')) {
      detectedFormat = 'png';
    }

    // Get the image data as base64
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:image/${detectedFormat};base64,${base64Image}`;

    return {
      success: true,
      chart_id,
      chart_url: dataUrl,
      format: format === 'auto' ? detectedFormat : format,
      content_type: contentType,
      detected_format: detectedFormat,
    };
  },
});
