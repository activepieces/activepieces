import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { gptzeroDetectAiAuth } from '../common/auth';

export const scanText = createAction({
  auth: gptzeroDetectAiAuth,
  name: 'scanText',
  displayName: 'Scan Text',
  description: 'Scan text content for AI-generated content detection',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text content to scan for AI-generated content',
      required: true,
    }),
  },
  async run(context) {
    const payload = {
      document: context.propsValue.text,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.gptzero.me/v2/predict/text',
      headers: {
        'x-api-key': context.auth.secret_text,
        'content-type': 'application/json',
      },
      body: payload,
    });

    return response.body;
  },
});
