import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JinaAICommon } from '../../common';
import { jinaAiAuth } from '../../auth';
import { jinaAiGetModelOutputSchema } from '../../output-schemas';

export const getModelAction = createAction({
  auth: jinaAiAuth,
  name: 'jina_ai_get_model',
  outputSchema: jinaAiGetModelOutputSchema,
  displayName: 'Get Model',
  description: 'Get details of a Jina model.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Read the details of one Jina model by id, including context length, modalities and pricing. Get the id from List Models.',
    idempotent: true,
  },
  props: {
    modelId: Property.ShortText({
      displayName: 'Model ID',
      description: 'Id of the model, returned by List Models.',
      required: true,
    }),
  },
  async run(context) {
    const response = await JinaAICommon.makeRequest({
      url: JinaAICommon.apiUrl({
        path: `/models/${encodeURIComponent(context.propsValue.modelId)}`,
      }),
      method: HttpMethod.GET,
      auth: context.auth.secret_text,
    });
    return response;
  },
});
