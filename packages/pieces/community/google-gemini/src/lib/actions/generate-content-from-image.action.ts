import { GoogleGenerativeAI } from '@google/generative-ai';
import mime from 'mime-types';
import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { googleGeminiAuth } from '../auth';
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
      description: 'The image to generate content from.'
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      auth: googleGeminiAuth,
      required: true,
      description: 'The model which will generate the completion',
      refreshers: [],
      defaultValue: defaultLLM,
      options: async ({ auth }) =>
        getGeminiModelOptions({ auth }),
    }),
  },

  async run({ auth, propsValue }) {
    const { image, model, prompt } = propsValue;
    const mimeType =
      mime.lookup(image.extension || image.filename) ||
      `image/${image.extension}`;

    const genAI = new GoogleGenerativeAI(auth.secret_text);
    const generativeModel = genAI.getGenerativeModel({ model });
    const result = await generativeModel.generateContent([
      prompt,
      {
        inlineData: {
          data: image.base64,
          mimeType,
        },
      },
    ]);

    const response = await result.response;
    return {
      text: response.text(),
      raw: response,
    };
  },
});
