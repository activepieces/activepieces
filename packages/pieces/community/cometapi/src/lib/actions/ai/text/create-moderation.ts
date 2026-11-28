import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometapiCreateModerationOutputSchema } from '../../../output-schemas';

export const createModerationAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_create_moderation',
  outputSchema: cometapiCreateModerationOutputSchema,
  displayName: 'Create Moderation',
  description: 'Checks texts for harmful content.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Classifies a batch of texts with an OpenAI-compatible moderation model such as omni-moderation-latest, returning per-text flagged status and category scores in input order. Text only; billed per call.',
    idempotent: true,
  },
  props: {
    model: cometApiAiProps.model({
      required: true,
      description: 'Moderation model ID, e.g. "omni-moderation-latest".',
    }),
    input: Property.Array({
      displayName: 'Input',
      description: 'The texts to classify, one item per text.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/moderations',
      body: {
        model: propsValue.model,
        input: propsValue.input,
      },
    });
  },
});
