import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const textToCadIterationAction = createAction({
  name: 'text_to_cad_iteration',
  displayName: 'Iterate CAD Model',
  description: 'Create a new iteration of an existing 3D model',
  audience: 'both',
  aiMetadata: { description: 'Generate a new CAD model iteration from a text prompt describing desired changes. Use to refine or evolve a design via natural language; to rate an existing result instead, use give-model-feedback. Not idempotent: each call starts a fresh generation, so avoid blind retries.', idempotent: false },
  auth: zooAuth,
  // category: 'Machine Learning (ML)',
  props: {
    prompt: Property.ShortText({
      displayName: 'Prompt',
      required: true,
      description: 'The prompt describing desired changes',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.zoo.dev/ml/text-to-cad/iteration',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      body: {
        prompt: propsValue.prompt,
      },
    });
    return response.body;
  },
});
