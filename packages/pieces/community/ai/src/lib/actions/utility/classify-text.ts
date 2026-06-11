import { createAction, Property } from '@activepieces/pieces-framework';
import { aiProps } from '../../common/props';
import { AIProviderName, ExecuteAiMode } from '@activepieces/shared';

export const classifyText = createAction({
  name: 'classifyText',
  displayName: 'Classify Text',
  description: 'Categorize any text input using custom labels, so your flow knows what to do next.',
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

    const provider = context.propsValue.provider as AIProviderName;
    const modelId = context.propsValue.model;

    const response = await context.ai.execute({
      mode: ExecuteAiMode.TEXT,
      provider,
      model: modelId,
      prompt: `As a text classifier, your task is to assign one of the following categories to the provided text: ${categories.join(
        ', '
      )}. Please respond with only the selected category as a single word, and nothing else.
      Text to classify: "${context.propsValue.text}"`,
      actionName: 'classifyText',
    });
    const result = (response.text ?? '').trim();

    if (!categories.includes(result)) {
      throw new Error(
        'Unable to classify the text into the provided categories.'
      );
    }

    return result;
  },
});
