import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { nanoid } from 'nanoid';
import {
  Property,
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
      description: 'The image to generate content from.'
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      description: 'The model which will generate the completion',
      refreshers: [],
      defaultValue: defaultLLM,
      options: async ({ auth }) =>
        getGeminiModelOptions({ auth }),
    }),
  },

  async run({ auth, propsValue }) {
    const tempFilePath = join(tmpdir(), `gemini-image-${nanoid()}.${propsValue.image.extension}`);

    try {
      const imageBuffer = Buffer.from(propsValue.image.base64, 'base64');
      await fs.writeFile(tempFilePath, imageBuffer);

      const fileManager = new GoogleAIFileManager(auth);
      const uploadResult = await fileManager.uploadFile(tempFilePath, {
        mimeType: `image/${propsValue.image.extension}`,
        displayName: propsValue.image.filename,
      });

      const genAI = new GoogleGenerativeAI(auth);
      const model = genAI.getGenerativeModel({ model: propsValue.model });
      const result = await model.generateContent([
        propsValue.prompt,
        {
          fileData: {
            fileUri: uploadResult.file.uri,
            mimeType: uploadResult.file.mimeType,
          },
        },
      ]);

      const response = await result.response;
      return {
        text: response.text(),
        raw: response,
      };
    } catch (error) {
      console.error('Error in generate content from image:', error);
      throw error;
    } finally {
      await fs.unlink(tempFilePath).catch(() => void 0);
    }
  },
});
