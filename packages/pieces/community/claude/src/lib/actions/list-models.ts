import { createAction } from '@activepieces/pieces-framework';
import Anthropic from '@anthropic-ai/sdk';
import { claudeAuth } from '../auth';
import { listModelsActionOutputSchema } from '../output-schemas';

export const listModelsAction = createAction({
  audience: 'ai',
  auth: claudeAuth,
  name: 'list_models',
  classification: 'SEARCH',
  displayName: 'List Models',
  description: 'Lists the Claude models available to this API key.',
  aiMetadata: {
    description:
      "Lists the Claude models available for use, most recently released first, returning each model's ID and display name. Use to discover a valid model ID before calling Ask Claude, Extract Structured Data, or Create Message Batch. Idempotent: it only reads data.",
    idempotent: true,
  },
  props: {},
  outputSchema: listModelsActionOutputSchema,
  async run(context) {
    const anthropic = new Anthropic({ apiKey: context.auth.secret_text });
    const models = [];
    for await (const model of anthropic.models.list({ limit: 1000 })) {
      models.push(model);
    }
    return { models };
  },
});
