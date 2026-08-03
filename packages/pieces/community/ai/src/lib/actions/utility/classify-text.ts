import { createAction, Property } from '@activepieces/pieces-framework';
import { generateText } from 'ai';
import { createAIModel } from '../../common/ai-sdk';
import { aiProps } from '../../common/props';
import { AIProviderName } from '@activepieces/pieces-framework';

export const classifyText = createAction({
  audience: 'both',
  name: 'classifyText',
  displayName: 'Classify Text',
  description: 'Categorize any text input using custom labels, so your flow knows what to do next.',
  aiMetadata: { description: 'Assigns exactly one label from a caller-supplied Categories list to a block of text using a text model, and errors if the model answers with anything outside that list. Pick it for routing or branching where the outcomes are known up front; use extractStructuredData for multiple typed fields, summarizeText to shorten text, or askAi when the answer is not one of a fixed set. Requires the text plus a non-empty Categories array matched by exact string, so keep labels short; read-only and idempotent.', idempotent: true },
  props: {
    provider: aiProps({ modelType: 'text' }).provider,
    model: aiProps({ modelType: 'text' }).model,
    text: Property.LongText({
      displayName: 'Text to Classify',
      required: true,
    }),
    categories: Property.Array({
      displayName: 'Categories',
      description: 'Categories to classify text into.',
      required: true,
    }),
  },
  async run(context) {
    const categories = (context.propsValue.categories as string[]) ?? [];

    const provider = context.propsValue.provider;
    const modelId = context.propsValue.model;

    const model = await createAIModel({
      provider: provider as AIProviderName,
      modelId,
      engineToken: context.server.token,
      apiUrl: context.server.apiUrl,
      projectId: context.project.id,
      flowId: context.flows.current.id,
      runId: context.run.id,
    });

    const response = await generateText({
      model,
      prompt: `As a text classifier, your task is to assign one of the following categories to the provided text: ${categories.join(
        ', '
      )}. Please respond with only the selected category as a single word, and nothing else.
      Text to classify: "${context.propsValue.text}"`,
    });
    const result = response.text.trim();

    if (!categories.includes(result)) {
      throw new Error(
        'Unable to classify the text into the provided categories.'
      );
    }

    return result;
  },
});
