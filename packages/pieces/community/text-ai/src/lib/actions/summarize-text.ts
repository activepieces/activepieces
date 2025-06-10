import { aiProps } from '@activepieces/pieces-common';
import { SUPPORTED_AI_PROVIDERS, createAIProvider } from '@activepieces/shared';
import { createAction, Property, Action } from '@activepieces/pieces-framework';
import { LanguageModel, generateText } from 'ai';

export const summarizeText: Action = createAction({
  name: 'summarizeText',
  displayName: 'Summarize Text',
  description: '',
  props: {
    provider: aiProps({ modelType: 'language' }).provider,
    model: aiProps({ modelType: 'language' }).model,
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
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
      defaultValue: 2000,
    }),
  },
  async run(context) {
    const providerName = context.propsValue.provider as string;
    const modelInstance = context.propsValue.model as LanguageModel;

    const providerConfig = SUPPORTED_AI_PROVIDERS.find(p => p.provider === providerName);
    if (!providerConfig) {
      throw new Error(`Provider ${providerName} not found`);
    }

    const baseURL = `${context.server.apiUrl}v1/ai-providers/proxy/${providerName}`;
    const engineToken = context.server.token;
    const provider = createAIProvider({
      providerName,
      modelInstance,
      apiKey: engineToken,
      baseURL,
    });

    const response = await generateText({
      model: provider,
      messages: [
        {
          role: 'user',
          content: `${context.propsValue.prompt} Summarize the following text : ${context.propsValue.text}`,
        },
      ],
      maxTokens: context.propsValue.maxTokens,
      headers: {
        'Authorization': `Bearer ${engineToken}`,
      },
    });

    return response.text ?? '';
  },
});
