import { AIUsageFeature, SUPPORTED_AI_PROVIDERS, createAIModel } from '@activepieces/common-ai';
import { createAction, Property, Action } from '@activepieces/pieces-framework';
import { LanguageModelV2 } from '@ai-sdk/provider';
import { generateText } from 'ai';
import { aiProps } from '@activepieces/common-ai';

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
    maxOutputTokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
      defaultValue: 2000,
    }),
  },
  async run(context) {
    const providerName = context.propsValue.provider as string;
    const modelInstance = context.propsValue.model as LanguageModelV2;

    const providerConfig = SUPPORTED_AI_PROVIDERS.find(p => p.provider === providerName);
    if (!providerConfig) {
      throw new Error(`Provider ${providerName} not found`);
    }

    const baseURL = `${context.server.apiUrl}v1/ai-providers/proxy/${providerName}`;
    const engineToken = context.server.token;
    const model = createAIModel({
      providerName,
      modelInstance,
      engineToken,
      baseURL,
      metadata: {
        feature: AIUsageFeature.TEXT_AI,
      },
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
        [providerName]: {
          ...(providerName === 'openai' ? { reasoning_effort: 'minimal' } : {}),
        }
      }
    });

    return response.text ?? '';
  },
});
