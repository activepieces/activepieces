import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { pandadocAuth } from '../common';
import { documentDropdown, watermarkTextDropdown, customWatermarkTextInput } from '../common/dynamic-dropdowns';

export const downloadDocument = createAction({
  name: 'downloadDocument',
  displayName: 'Download Document',
  description: 'Downloads a document as PDF.',
  auth: pandadocAuth,
  props: {
    document_id: documentDropdown,
    separate_files: Property.Checkbox({
      displayName: 'Download as Separate Files',
      description: 'Download document bundle as a zip archive of separate PDFs (1 file per section)',
      required: false,
      defaultValue: false,
    }),
    watermark_text: watermarkTextDropdown,
    custom_watermark_text: customWatermarkTextInput,
    watermark_color: Property.StaticDropdown({
      displayName: 'Watermark Color',
      description: 'Select a watermark color or use custom HEX code',
      required: false,
      options: {
        options: [
          { label: 'Red (#FF0000)', value: '#FF0000' },
          { label: 'Blue (#0000FF)', value: '#0000FF' },
          { label: 'Green (#00FF00)', value: '#00FF00' },
          { label: 'Black (#000000)', value: '#000000' },
          { label: 'Gray (#808080)', value: '#808080' },
          { label: 'Orange (#FF7F00)', value: '#FF7F00' },
          { label: 'Purple (#800080)', value: '#800080' },
          { label: 'Custom HEX Code', value: 'custom' },
        ],
      },
    }),
    custom_watermark_color: Property.ShortText({
      displayName: 'Custom Watermark Color',
      description: 'Enter a custom HEX color code (e.g., #FF5733). Only used if "Custom HEX Code" is selected above.',
      required: false,
    }),
    watermark_font_size: Property.Number({
      displayName: 'Watermark Font Size',
      description: 'Font size of the watermark text',
      required: false,
    }),
    watermark_opacity: Property.Number({
      displayName: 'Watermark Opacity',
      description: 'Opacity of the watermark (0.0 to 1.0)',
      required: false,
    }),
  },
  async run({ auth, propsValue,files }) {
    const queryParams: any = {};

    if (propsValue.separate_files) {
      queryParams.separate_files = propsValue.separate_files;
    }

    // Handle watermark text with custom support
    if (propsValue.watermark_text) {
      let watermarkText;
      if (propsValue.watermark_text === 'custom' && propsValue.custom_watermark_text) {
        watermarkText = propsValue.custom_watermark_text;
      } else if (propsValue.watermark_text !== 'custom') {
        watermarkText = propsValue.watermark_text;
      }
      if (watermarkText) {
        queryParams.watermark_text = watermarkText;
      }
    }

    if (propsValue.watermark_color) {
      // Use custom color if specified, otherwise use selected preset
      const colorValue = propsValue.watermark_color === 'custom'
        ? propsValue.custom_watermark_color
        : propsValue.watermark_color;
      if (colorValue) {
        queryParams.watermark_color = colorValue;
      }
    }
    if (propsValue.watermark_font_size) {
      queryParams.watermark_font_size = propsValue.watermark_font_size;
    }
    if (propsValue.watermark_opacity !== undefined) {
      queryParams.watermark_opacity = propsValue.watermark_opacity;
    }

    const queryString = new URLSearchParams(queryParams).toString();
    const endpoint = `https://api.pandadoc.com/public/v1/documents/${propsValue.document_id}/download${queryString ? `?${queryString}` : ''}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: endpoint,
      headers: {
        Authorization: `API-Key ${(auth as string)}`,
      },
      responseType:'arraybuffer'
    });

     return {
      file: await files.write({
        fileName: 'file.pdf',
        data: Buffer.from(response.body)
      })
    }
  },
});
