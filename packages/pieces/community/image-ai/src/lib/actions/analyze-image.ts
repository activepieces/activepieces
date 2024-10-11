import { createAction, Property } from '@activepieces/pieces-framework';
import { AI, aiProps } from '@activepieces/pieces-common';

export const analyzeImage = createAction({
  name: 'analyzeImage',
  displayName: 'Analyze Image',
  description: '',
  props: {
    provider: aiProps('text').provider,
    model: aiProps('text').model,
    image: Property.File({
      displayName: 'Image',
      description: 'The image URL or file you want analyze to read.',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      defaultValue:
        'Analyze the image and provide a description of the content.',
      required: true,
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
      defaultValue: 2000,
    }),
  },
  async run(context) {
    const ai = AI({
      provider: context.propsValue.provider,
      server: context.server,
    });

    const image = ai.image?.analyze;

    if (!image) {
      throw new Error(
        `Model ${context.propsValue.model} does not support image analysis.`
      );
    }

    const response = await image({
      model: context.propsValue.model,
      image: context.propsValue.image,
      prompt: context.propsValue.prompt,
      maxTokens: context.propsValue.maxTokens,
    });

    const text = response?.choices[0].content;
    if (text) {
      return text;
    } else {
      throw new Error(
        'Unknown error occurred. Please check image configuration.'
      );
    }
  },
});
