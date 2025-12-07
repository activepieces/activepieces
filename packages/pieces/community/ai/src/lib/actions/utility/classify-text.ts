import { createAction, Property } from '@activepieces/pieces-framework';
import { generateText } from 'ai';
import { createAIModel } from '../../common/ai-sdk';
import { aiProps } from '../../common/props';

export const classifyText = createAction({
  name: 'classifyText',
  displayName: 'Classify Text',
  description: 'Classify your text into one of your provided categories.',
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
