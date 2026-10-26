import { AgentPieceProps, AiStepAction, createAction, Property } from '@activepieces/pieces-framework';
import { runOnWorker } from '../../common/ai-step';
import { aiModel } from '../../common/props';

export const classifyText = createAction({
  audience: 'both',
  name: 'classifyText',
  classification: 'READ',
  displayName: 'Classify Text',
  description: 'Sort text into one of your categories to branch the flow.',
  aiMetadata: { description: 'Assigns exactly one label from a caller-supplied Categories list to a block of text using a text model, and errors if the model answers with anything outside that list. Pick it for routing or branching where the outcomes are known up front; use extractStructuredData for multiple typed fields, summarizeText to shorten text, or askAi when the answer is not one of a fixed set. Requires the text plus a non-empty Categories array matched by exact string, so keep labels short; read-only and idempotent.', idempotent: true },
  props: {
    [AgentPieceProps.AI_PROVIDER_MODEL]: aiModel.prop(),
    text: Property.LongText({
      displayName: 'Text',
      required: true,
    }),
    categories: Property.Array({
      displayName: 'Categories',
      description: 'The AI picks exactly one of these.',
      required: true,
    }),
  },
  async run(context) {
    const model = aiModel.resolveOrThrow(context.propsValue.aiProviderModel);
    const categories = ((context.propsValue.categories as unknown[]) ?? []).map((category) => String(category));

    const result = await runOnWorker({
      context,
      buildRequest: async () => ({
        action: AiStepAction.CLASSIFY_TEXT,
        ...model,
        text: context.propsValue.text,
        categories,
      }),
    });

    if (result.status === 'paused') {
      return {};
    }

    return result.output.answer;
  },
});
