import { createAction, Property } from '@activepieces/pieces-framework';
import { AI, AIChatRole, aiProps } from '@activepieces/pieces-common';

export const classifyTextOrImage = createAction({
  name: 'classifyTextOrImage',
  displayName: 'Classify Text',
  description: 'Classify your text into one of your provided categories.',
  props: {
    provider: aiProps('text').provider,
    model: aiProps('text').model,
    // inputType: Property.StaticDropdown({
    //   displayName: 'Input Type',
    //   description: 'Type of input to be classify.',
    //   required: true,
    //   defaultValue: 'text',
    //   options: {
    //     disabled: false,
    //     options: [
    //       { label: 'Text', value: 'text' },
    //       { label: 'Image', value: 'image' },
    //     ],
    //   },
    // }),
    body: Property.LongText({
      displayName: 'Text to Classify',
      required: true,
    }),
    categories: Property.Array({
      displayName: 'Categories',
      description: 'Categories to classify text into.',
      required: true,
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
      defaultValue: 2000,
    }),
  },
  async run(context) {
    const categories = (context.propsValue.categories as string[]) ?? [];

    const ai = AI({
      provider: context.propsValue.provider,
      server: context.server,
    });

    const response = await ai.chat.text({
      model: context.propsValue.model,
      maxTokens: context.propsValue.maxTokens,
      messages: [
        {
          role: AIChatRole.USER,
          content: `As a text classifier, your task is to assign one of the following categories to the provided text: ${categories.join(
            ', '
          )}. Please respond with only the selected category as a single word, and nothing else.
          Text to classify: "${context.propsValue.body}"`,
        },
      ],
    });

    const result = response.choices[0].content.trim();

    if (!categories.includes(result)) {
      throw new Error(
        'Unable to classify the text into the provided categories.'
      );
    }

    return result;
  },
});
