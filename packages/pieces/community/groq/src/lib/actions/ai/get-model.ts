import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { groqAuth } from '../../auth';
import { groqAiProps } from '../../common/ai-props';
import { groqClient } from '../../common/client';
import { groqGetModelOutputSchema } from '../../output-schemas';

export const getModelAction = createAction({
  auth: groqAuth,
  name: 'groq_get_model',
  outputSchema: groqGetModelOutputSchema,
  displayName: 'Get Model',
  description: 'Get the details of one Groq model.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one model by ID: owner, context window, creation time and whether it is active. Model IDs come from List Models.',
    idempotent: true,
  },
  props: {
    modelId: groqAiProps.modelId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await groqClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/models/${propsValue.modelId.split('/').map(encodeURIComponent).join('/')}`,
    });
  },
});
