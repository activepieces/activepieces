import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Property,
  Validators,
  createAction,
} from '@activepieces/pieces-framework';
import { googleGeminiAuth } from '../../index';
import { defaultLLM, getGeminiModelOptions } from '../common/common';

export const generateContentFromImageAction = createAction({
  description:
    'Generate content using Google Gemini using the "gemini-pro-vision" model',
  displayName: 'Generate Content from Image',
  name: 'generate_content_from_image',
  auth: googleGeminiAuth,
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'The prompt to generate content from.',
    }),
    image: Property.File({
      displayName: 'Image',
      required: true,
      description: 'The image to generate content from.',
      validators: [Validators.image],
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      description: 'The model which will generate the completion',
      refreshers: [],
      defaultValue: defaultLLM,
      options: async ({ auth }) => getGeminiModelOptions({ auth }),
    }),
  },

  async run({ auth, propsValue }) {
    try {
      const genAI = new GoogleGenerativeAI(auth);
      const model = genAI.getGenerativeModel({ model: propsValue.model });
      const result = await model.generateContent([
        propsValue.prompt,
        {
          inlineData: {
            data: propsValue.image.base64,
            mimeType: `image/${propsValue.image.extension}`,
          },
        },
      ]);

      const response = result.response;
      return {
        text: response.text(),
        raw: response,
      };
    } catch (error) {
      console.error('Error in generate content from image:', error);
      throw error;
    }
  },
});
