import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pdfCoAuth } from '../..';

export const convertPdfToJsonCsvXml = createAction({
  name: 'convertPdfToJsonCsvXml',
  displayName: 'Convert PDF to JSON/CSV/XML',
  description: 'Transform PDF content into structured formats for data integration and automation.',
  auth: pdfCoAuth,
  props: {
    url: Property.ShortText({
      displayName: 'PDF URL',
      description: 'URL to the source PDF file',
      required: true,
    }),
    outputFormat: Property.StaticDropdown({
      displayName: 'Output Format',
      description: 'Select the desired output format',
      required: true,
      options: {
        options: [
          { label: 'CSV', value: 'csv' },
          { label: 'JSON', value: 'json' },
          { label: 'XML', value: 'xml' }
        ]
      }
    }),
    inline: Property.Checkbox({
      displayName: 'Return Inline Data',
      description: 'Set to true to return data inline, false to return a link to the output file',
      required: false,
      defaultValue: true,
    }),
    async: Property.Checkbox({
      displayName: 'Async Mode',
      description: 'Set to true for long processes to run in the background',
      required: false,
      defaultValue: false,
    }),
    // CSV-specific properties
    lang: Property.ShortText({
      displayName: 'OCR Language',
      description: 'Set the language for OCR. Default is "eng". Only applicable for CSV format.',
      required: false,
      defaultValue: 'eng',
    }),
    unwrap: Property.Checkbox({
      displayName: 'Unwrap Lines',
      description: 'Unwrap lines into a single line within table cells. Only applicable for CSV format.',
      required: false,
    }),
    pages: Property.ShortText({
      displayName: 'Pages',
      description: 'Comma-Separated list of page indices (or ranges) to process. Example: 0,2-5,7- (first page, pages 3-6, and 8 to end). Only applicable for CSV format.',
      required: false,
      defaultValue: '0-',
    }),
    rect: Property.ShortText({
      displayName: 'Rectangle Coordinates',
      description: 'Defines coordinates for extraction, e.g. "51.8, 114.8, 235.5, 204.0". Only applicable for CSV format.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Output File Name',
      description: 'File name for the generated output',
      required: false,
    }),
    password: Property.ShortText({
      displayName: 'PDF Password',
      description: 'Password if the PDF is password-protected. Only applicable for CSV format.',
      required: false,
    }),
    lineGrouping: Property.Checkbox({
      displayName: 'Line Grouping',
      description: 'Enable line grouping within table cells. Only applicable for CSV format.',
      required: false,
    }),
    profiles: Property.ShortText({
      displayName: 'Profiles',
      description: 'Additional configuration profiles. Only applicable for CSV format.',
      required: false,
    }),
  },
  async run(context) {
    const outputFormat = context.propsValue.outputFormat;
    
    // Determine the API endpoint based on the selected output format
    let endpoint;
    switch (outputFormat) {
      case 'csv':
        endpoint = 'https://api.pdf.co/v1/pdf/convert/to/csv';
        break;
      case 'json':
        endpoint = 'https://api.pdf.co/v1/pdf/convert/to/json2';
        break;
      case 'xml':
        endpoint = 'https://api.pdf.co/v1/pdf/convert/to/xml';
        break;
      default:
        throw new Error(`Unsupported output format: ${outputFormat}`);
    }

    // Build common request payload
    const payload: Record<string, unknown> = {
      url: context.propsValue.url,
      inline: context.propsValue.inline,
      async: context.propsValue.async
    };

    // Add format-specific parameters
    if (outputFormat === 'csv') {
      if (context.propsValue.lang) payload['lang'] = context.propsValue.lang;
      if (context.propsValue.unwrap !== undefined) payload['unwrap'] = context.propsValue.unwrap;
      if (context.propsValue.pages) payload['pages'] = context.propsValue.pages;
      if (context.propsValue.rect) payload['rect'] = context.propsValue.rect;
      if (context.propsValue.lineGrouping !== undefined) {
        payload['lineGrouping'] = context.propsValue.lineGrouping ? '1' : '';
      }
      if (context.propsValue.password) payload['password'] = context.propsValue.password;
      if (context.propsValue.profiles) payload['profiles'] = context.propsValue.profiles;
    }
    
    // Add name parameter for all formats if specified
    if (context.propsValue.name) payload['name'] = context.propsValue.name;

    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: endpoint,
      headers: {
        'x-api-key': context.auth,
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    if (response.status !== 200) {
      throw new Error(`PDF.co API Error: ${response.status} ${JSON.stringify(response.body)}`);
    }

    return response.body;
  },
});
