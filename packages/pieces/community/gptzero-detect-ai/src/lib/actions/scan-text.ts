import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { gptzeroDetectAiAuth } from '../common/auth';

export const scanText = createAction({
  auth: gptzeroDetectAiAuth,
  name: 'scanText',
  displayName: 'Scan Text',
  description: 'Scan text content for AI-generated content detection',
  audience: 'both',
  aiMetadata: {
    description: 'Submits a raw text string to GPTZero to estimate how likely it was AI-generated, returning per-document and per-sentence detection scores. Choose this when you already have the text inline; use Scan File instead when the content is in a file. Read-only analysis: re-running with the same text is safe and yields the same result.',
    idempotent: true,
  },
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
