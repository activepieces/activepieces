import { AIProviderName } from '@activepieces/pieces-framework';
import { createAIModel } from '../../common/ai-sdk';
import { createAction, Property } from '@activepieces/pieces-framework';
import { generateText } from 'ai';
import { aiProps } from '../../common/props';

export const summarizeText = createAction({
  audience: 'both',
  name: 'summarizeText',
  displayName: 'Summarize Text',
  description: 'Summarize long emails, articles, or documents into what matters.',
  aiMetadata: { description: 'Condenses one block of supplied text into a shorter summary using a chosen text model. Pick it when the goal is a shorter version of text you already have; use extractStructuredData for specific typed fields, classifyText for a label, or askAi for open-ended questions. Requires a provider/model, the text inline (it fetches no URLs and reads no files) and the Prompt prop, which carries a default guide instruction but is still required; not idempotent, as generation runs at temperature 1, so identical text returns differently worded summaries.', idempotent: false },
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
      messages: [
        {
          role: 'user',
          content: `${context.propsValue.prompt} Summarize the following text : ${context.propsValue.text}`
        },
      ],
      maxOutputTokens: context.propsValue.maxOutputTokens,
      temperature: 1,
      providerOptions: {
        [provider]: {
          ...(provider === AIProviderName.OPENAI ? { reasoning_effort: 'minimal' } : {}),
        }
      }
    });

    return response.text ?? '';
  },
});
