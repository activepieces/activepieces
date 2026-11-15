import { AgentPieceProps, AiStepAction, createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { runOnWorker } from '../../common/ai-step';
import { aiModel } from '../../common/props';

export const summarizeText = createAction({
  audience: 'both',
  name: 'summarizeText',
  classification: 'READ',
  displayName: 'Summarize Text',
  description: 'Summarize long emails, articles, or documents into what matters.',
  aiMetadata: { description: 'Condenses one block of supplied text into a shorter summary using a chosen text model. Pick it when the goal is a shorter version of text you already have; use extractStructuredData for specific typed fields, classifyText for a label, or askAi for open-ended questions. Requires an AI Model (a tier or a provider/model), the text inline (it fetches no URLs and reads no files) and the Prompt prop, which carries a default guide instruction but is still required; not idempotent, as generation is non-deterministic, so identical text returns differently worded summaries.', idempotent: false },
  props: {
    [AgentPieceProps.AI_PROVIDER_MODEL]: aiModel.prop(),
    text: Property.LongText({
      displayName: 'Text',
      required: true,
    }),
    prompt: Property.ShortText({
      displayName: 'Prompt',
      defaultValue:
        'Summarize the following text in a clear and concise manner, capturing the key points and main ideas while keeping the summary brief and informative.',
      required: true,
      description: 'How to summarize. Edit it to change length, tone or focus.',
    }),
    maxOutputTokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
      defaultValue: 2000,
      description: 'Longest reply allowed, in tokens. Raise it if a long reply fails or stops short.',
      advanced: true,
    }),
  },
  async run(context) {
    const model = aiModel.resolveOrThrow(context.propsValue.aiProviderModel);

    const result = await runOnWorker({
      context,
      buildRequest: async () => ({
        action: AiStepAction.SUMMARIZE_TEXT,
        ...model,
        prompt: context.propsValue.prompt,
        text: context.propsValue.text,
        ...spreadIfDefined('maxOutputTokens', context.propsValue.maxOutputTokens),
      }),
    });

    if (result.status === 'paused') {
      return {};
    }

    return result.output.answer;
  },
});
