import { GoogleGenerativeAI } from '@google/generative-ai';
import mime from 'mime-types';
import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { googleGeminiAuth } from '../auth';
import { defaultLLM, getGeminiModelOptions } from '../common/common';
import { generateContentFromImageActionOutputSchema } from '../output-schemas';

export const generateContentFromImageAction = createAction({
  audience: 'both',
  description:
    'Generate content using Google Gemini using the "gemini-pro-vision" model',
  aiMetadata: { description: 'Sends an image together with a prompt to a vision-capable Gemini model and returns the generated text describing or answering questions about that image, covering captioning, text extraction, and visual question answering. This is the only Gemini action here that accepts image input, so pick it over generate_content whenever a picture is part of the question; the image is required and is sent inline, so keep it small. Not idempotent: each call produces a fresh completion.', idempotent: false },
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
  outputSchema: generateContentFromImageActionOutputSchema,

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
