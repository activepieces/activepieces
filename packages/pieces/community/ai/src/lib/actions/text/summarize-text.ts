import { AIProviderName } from '../../common/types';
import { createAIModel } from '../../common/ai-sdk';
import { createAction, Property } from '@activepieces/pieces-framework';
import { generateText } from 'ai';
import { aiProps } from '../../common/props';

export const summarizeText = createAction({
  name: 'summarizeText',
  displayName: 'Summarize Text',
  description: '',
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
    const providerId = context.propsValue.provider;
    const modelId = context.propsValue.model;

    const model = await createAIModel({
      providerId,
      modelId,
      engineToken: context.server.token,
      apiUrl: context.server.apiUrl,
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
        [providerId]: {
          ...(providerId === AIProviderName.OPENAI ? { reasoning_effort: 'minimal' } : {}),
        }
      }
    });

    return response.text ?? '';
  },
});
