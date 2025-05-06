import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../../index';

export const extractDocument = createAction({
  name: 'extract_document',
  auth: dumplingAuth,
  displayName: 'Extract Document Data',
  description: 'Extract structured data from documents using vision-capable AI',
  props: {
    inputMethod: Property.StaticDropdown({
      displayName: 'Input Method',
      required: true,
      options: {
        options: [
          { label: 'URL', value: 'url' },
          { label: 'Base64', value: 'base64' },
        ],
      },
      description: 'How to provide the document files',
    }),
    files: Property.Array({
      displayName: 'Files',
      required: true,
      description: 'Array of URLs or base64-encoded file contents depending on input method',
    }),
    prompt: Property.LongText({
      displayName: 'Extraction Prompt',
      required: true,
      description: 'The prompt describing what data to extract from the documents',
    }),
    jsonMode: Property.Checkbox({
      displayName: 'JSON Mode',
      required: false,
      defaultValue: false,
      description: 'Whether to return the result in JSON format',
    }),
  },
  async run(context) {
    const {
      inputMethod,
      files,
      prompt,
      jsonMode
    } = context.propsValue;

    const requestBody: Record<string, any> = {
      inputMethod,
      files,
      prompt
    };

    // Add optional parameters if provided
    if (jsonMode !== undefined) requestBody['jsonMode'] = jsonMode;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://app.dumplingai.com/api/v1/extract-document',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.auth}`,
      },
      body: requestBody,
    });

    return response.body;
  },
}); 