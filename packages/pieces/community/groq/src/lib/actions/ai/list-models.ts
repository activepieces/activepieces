import { createAction } from '@activepieces/pieces-framework';
import { groqAuth } from '../../auth';
import { groqApi } from '../../common/api';
import { groqListModelsOutputSchema } from '../../output-schemas';

export const listModelsAction = createAction({
  auth: groqAuth,
  name: 'groq_list_models',
  outputSchema: groqListModelsOutputSchema,
  displayName: 'List Models',
  description: 'List the models available to your Groq account.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every model the account can call, with its ID, owner, context window and active flag. Call it first to get the model IDs every other Groq action takes; use Get Model for one model.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await groqApi.listModels({ auth });
  },
});
