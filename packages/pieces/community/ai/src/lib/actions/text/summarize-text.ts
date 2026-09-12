import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { runOnWorker } from '../../common/ai-step';
import { aiProps, aiProviderSelection } from '../../common/props';

export const summarizeText = createAction({
  audience: 'both',
  name: 'summarizeText',
  classification: 'READ',
  displayName: 'Summarize Text',
  description: 'Summarize long emails, articles, or documents into what matters.',
  aiMetadata: { description: 'Condenses one block of supplied text into a shorter summary using a chosen text model. Pick it when the goal is a shorter version of text you already have; use extractStructuredData for specific typed fields, classifyText for a label, or askAi for open-ended questions. Requires a provider/model, the text inline (it fetches no URLs and reads no files) and the Prompt prop, which carries a default guide instruction but is still required; not idempotent, as generation is non-deterministic, so identical text returns differently worded summaries.', idempotent: false },
  props: {
    provider: aiProps({ modelType: 'text' }).provider,
    model: aiProps({ modelType: 'text' }).model,
    text: Property.LongText({
      displayName: 'Text',
      required: true,
    }),
    prompt: Property.ShortText({
      displayName: 'Prompt',
      defaultValue:
        'Summarize the following text in a clear and concise manner, capturing the key points and main ideas while keeping the summary brief and informative.',
      required: true,
    }),
    maxOutputTokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
      defaultValue: 2000,
    }),
  },
  async run(context) {
    const { provider, configId } = aiProviderSelection.resolveOrThrow(context.propsValue.provider);

    const result = await runOnWorker({
      context,
      request: {
        action: 'SUMMARIZE_TEXT',
        provider,
        ...spreadIfDefined('providerConfigId', configId),
        modelId: context.propsValue.model,
        prompt: context.propsValue.prompt,
        text: context.propsValue.text,
        ...spreadIfDefined('maxOutputTokens', context.propsValue.maxOutputTokens),
      },
    });

    if (result.status === 'paused') {
      return {};
    }

    return result.output.answer;
  },
});
