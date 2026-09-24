import { createAction, Property } from '@activepieces/pieces-framework';
import Anthropic from '@anthropic-ai/sdk';
import { claudeAuth } from '../auth';
import { getModelActionOutputSchema } from '../output-schemas';

export const getModelAction = createAction({
  audience: 'ai',
  auth: claudeAuth,
  name: 'get_model',
  classification: 'READ',
  displayName: 'Get Model',
  description: 'Reads details for a single Claude model, or resolves a model alias to its ID.',
  aiMetadata: {
    description:
      "Reads a single Claude model by ID or alias (e.g. 'claude-3-7-sonnet-latest'), returning its resolved ID, display name, and release date. Use to confirm a model ID is valid or resolve an alias before using it elsewhere. Idempotent: it only reads data.",
    idempotent: true,
  },
  props: {
    modelId: Property.ShortText({
      displayName: 'Model ID',
      description: 'The model ID or alias to look up.',
      required: true,
    }),
  },
  outputSchema: getModelActionOutputSchema,
  async run(context) {
    const anthropic = new Anthropic({ apiKey: context.auth.secret_text });
    return anthropic.models.retrieve(context.propsValue.modelId);
  },
});
