import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { runOnWorker } from '../../common/ai-step';
import { aiProps, aiProviderSelection } from '../../common/props';

export const classifyText = createAction({
  audience: 'both',
  name: 'classifyText',
  classification: 'READ',
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
    const { provider, configId } = aiProviderSelection.resolveOrThrow(context.propsValue.provider);
    const categories = ((context.propsValue.categories as unknown[]) ?? []).map((category) => String(category));

    const result = await runOnWorker({
      context,
      request: {
        action: 'CLASSIFY_TEXT',
        provider,
        ...spreadIfDefined('providerConfigId', configId),
        modelId: context.propsValue.model,
        text: context.propsValue.text,
        categories,
      },
    });

    if (result.status === 'paused') {
      return {};
    }

    return result.output.answer;
  },
});
