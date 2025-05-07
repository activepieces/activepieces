import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pdfCoAuth } from '../../index';

export const addTextOrImageToPdf = createAction({
  name: 'addTextOrImageToPdf',
  displayName: 'Add Text or Image to PDF',
  description: 'Add text, images, and fill interactive PDF forms.',
  auth: pdfCoAuth,
  props: {
    url: Property.ShortText({
      displayName: 'PDF URL',
      description: 'URL to the source PDF file',
      required: true,
    }),
    annotationsString: Property.LongText({
      displayName: 'Text Annotations',
      description: 'Text objects to add to PDF. Format: "x;y;pages;text;fontsize;fontname;fontcolor;link;transparent;width;height;alignment"',
      required: false,
    }),
    imagesString: Property.LongText({
      displayName: 'Images',
      description:
        'Images or PDFs to add on top of the source PDF. Format: "x;y;pages;urlToImageOrPdf;linkToOpen;width;height"',
      required: false,
    }),
    fieldsString: Property.LongText({
      displayName: 'Form Fields',
      description: 'Set values for fillable PDF form fields. Format: "page;fieldName;value"',
      required: false,
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
    };

    // Add optional parameters if provided
    if (context.propsValue.annotationsString) {
      payload['annotationsString'] = context.propsValue.annotationsString;
    }

    if (context.propsValue.imagesString) {
      payload['imagesString'] = context.propsValue.imagesString;
    }

    if (context.propsValue.fieldsString) {
      payload['fieldsString'] = context.propsValue.fieldsString;
    }

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
