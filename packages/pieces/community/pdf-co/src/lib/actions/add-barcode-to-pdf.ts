import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pdfCoAuth } from '../../index';

export const addBarcodeToPdf = createAction({
  name: 'addBarcodeToPdf',
  displayName: 'Add Barcode to PDF',
  description: 'Embed barcodes (e.g., QR, Code128) into a PDF for tracking, scanning, or labeling.',
  auth: pdfCoAuth,
  props: {
    url: Property.ShortText({
      displayName: 'PDF URL',
      description: 'URL to the source PDF file',
      required: true,
    }),
    imagesString: Property.LongText({
      displayName: 'Barcode Image',
      description: 'Barcode image to add to PDF. Format: "x;y;pages;urlToBarcodeImage;linkToOpen;width;height"',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'Output File Name',
      description: 'File name for the generated output',
      required: false,
    }),
    async: Property.Checkbox({
      displayName: 'Async Mode',
      description: 'Set to true for long processes to run in the background',
      required: false,
      defaultValue: false,
    }),
    inline: Property.Checkbox({
      displayName: 'Inline Output',
      description: 'Set to true to get a direct link to output PDF',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const apiKey = context.auth;
    const baseUrl = 'https://api.pdf.co/v1';
    
    const payload: Record<string, unknown> = {
      url: context.propsValue.url,
      imagesString: context.propsValue.imagesString,
    };
    
    // Add optional parameters if provided
    if (context.propsValue.fileName) {
      payload['name'] = context.propsValue.fileName;
    }
    
    if (context.propsValue.async !== undefined) {
      payload['async'] = context.propsValue.async;
    }
    
    if (context.propsValue.inline !== undefined) {
      payload['inline'] = context.propsValue.inline;
    }
    
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/pdf/edit/add`,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    if (response.status !== 200) {
      throw new Error(
        `PDF.co API Error: ${response.status} ${JSON.stringify(response.body)}`
      );
    }

    return response.body;
  },
});
