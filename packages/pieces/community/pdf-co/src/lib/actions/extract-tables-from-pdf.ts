import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pdfCoAuth } from '../..';

export const extractTablesFromPdf = createAction({
  name: 'extractTablesFromPdf',
  displayName: 'Extract Tables from PDF',
  description: 'Identifies and extracts tabular data from PDFs',
  auth: pdfCoAuth,
  props: {
    url: Property.ShortText({
      displayName: 'PDF URL',
      description: 'URL to the source PDF file',
      required: true,
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
    password: Property.ShortText({
      displayName: 'PDF Password',
      description: 'Password if the PDF is password-protected',
      required: false,
    }),
  },
  async run(context) {
    const payload: Record<string, unknown> = {
      url: context.propsValue.url,
    };

    // Add optional parameters if provided
    if (context.propsValue.inline !== undefined) {
      payload['inline'] = context.propsValue.inline;
    }

    if (context.propsValue.async !== undefined) {
      payload['async'] = context.propsValue.async;
    }

    if (context.propsValue.password) {
      payload['password'] = context.propsValue.password;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.pdf.co/v1/pdf/find/table',
      headers: {
        'x-api-key': context.auth,
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
