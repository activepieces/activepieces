import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sofyaAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const extractAction = createAction({
  name: 'extract',
  displayName: 'Extract',
  description: 'Fetch a page and extract specific information from it using AI.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch a single web page and use AI to extract specific information described by a prompt (e.g. pricing tiers, specs, author and date), returning targeted text rather than the full page. If the page has no usable text, the response reports low content instead of fabricating an answer. Costs 5 credits. Read-only and idempotent.',
    idempotent: true,
  },
  auth: sofyaAuth,
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The URL to extract information from.',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'What information to extract (e.g. "list all pricing tiers with features").',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await makeRequest({
      token: auth.secret_text,
      method: HttpMethod.POST,
      path: '/extract',
      body: {
        url: propsValue.url,
        prompt: propsValue.prompt,
      },
    });
  },
});
