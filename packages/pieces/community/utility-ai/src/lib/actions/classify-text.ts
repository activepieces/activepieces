import { createAction, Property } from '@activepieces/pieces-framework';
import { LanguageModelV2 } from '@ai-sdk/provider';
import { generateText } from 'ai';
import { AIUsageFeature, createAIModel, SUPPORTED_AI_PROVIDERS } from '@activepieces/common-ai';
import { aiProps } from '@activepieces/common-ai';

export const classifyText = createAction({
  name: 'classifyText',
  displayName: 'Classify Text',
  description: 'Classify your text into one of your provided categories.',
  props: {
    provider: aiProps({ modelType: 'language' }).provider,
    model: aiProps({ modelType: 'language' }).model,
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
        feature: AIUsageFeature.UTILITY_AI,
      },
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
