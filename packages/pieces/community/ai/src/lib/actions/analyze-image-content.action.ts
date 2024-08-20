import { createAction, Property } from '@activepieces/pieces-framework';

export const analyzeImageContentAction = createAction({
  name: 'analyze-image-content',
  displayName: 'Analyze Image Content',
  description: '',
  props: {
    image: Property.File({
      displayName: 'Image',
      description: "The image URL or file you want GPT's vision to read.",
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Question',
      description: 'What do you want ChatGPT to tell you about the image?',
      required: true,
    }),
  },
  async run(context) {},
});
