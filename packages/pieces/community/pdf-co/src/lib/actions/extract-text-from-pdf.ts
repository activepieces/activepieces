import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pdfCoAuth } from '../..';

export const extractTextFromPdf = createAction({
  name: 'extractTextFromPdf',
  displayName: 'Extract Text from PDF',
  description: 'Retrieve plain text from documents such as legal files or reports for processing or analysis.',
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
  },
  async run(context) {
    const payload = {
      url: context.propsValue.url,
      inline: context.propsValue.inline,
      async: context.propsValue.async
    };

    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.pdf.co/v1/pdf/convert/to/text-simple',
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
