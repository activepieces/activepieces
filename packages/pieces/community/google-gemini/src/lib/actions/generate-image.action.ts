import { createAction, Property } from '@activepieces/pieces-framework';
import { GoogleGenAI } from '@google/genai';
import mime from 'mime-types';
import { googleGeminiAuth } from '../auth';
import { getGeminiImageModelOptions } from '../common/common';
import { generateImageActionOutputSchema } from '../output-schemas';

export const generateImageAction = createAction({
  audience: 'both',
  name: 'generate_image',
  classification: 'READ',
  auth: googleGeminiAuth,
  displayName: 'Generate Image',
  description: 'Generate an image from a text prompt using a Gemini image model.',
  aiMetadata: {
    description:
      'Generates an image from a text prompt using a Gemini image-generation model (e.g. Nano Banana) and returns it as a downloadable file. Use this for text-to-image; generate_content_from_image goes the other direction (image in, text out), and create_video is for motion output. Not idempotent: each call renders a new image.',
    idempotent: false,
  },
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'Describe the image you want to generate.',
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      auth: googleGeminiAuth,
      refreshers: [],
      options: async ({ auth }) => getGeminiImageModelOptions({ auth }),
    }),
    aspectRatio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      required: false,
      defaultValue: '1:1',
      options: {
        disabled: false,
        options: [
          { label: '1:1 (Square)', value: '1:1' },
          { label: '2:3 (Portrait)', value: '2:3' },
          { label: '3:2 (Landscape)', value: '3:2' },
          { label: '3:4 (Portrait)', value: '3:4' },
          { label: '4:3 (Landscape)', value: '4:3' },
          { label: '9:16 (Portrait)', value: '9:16' },
          { label: '16:9 (Landscape)', value: '16:9' },
          { label: '21:9 (Widescreen)', value: '21:9' },
        ],
      },
    }),
    imageSize: Property.StaticDropdown({
      displayName: 'Image Size',
      required: false,
      defaultValue: '1K',
      options: {
        disabled: false,
        options: [
          { label: '1K', value: '1K' },
          { label: '2K', value: '2K' },
          { label: '4K', value: '4K' },
        ],
      },
    }),
  },
  outputSchema: generateImageActionOutputSchema,
  async run({ auth, propsValue, files }) {
    const { prompt, model, aspectRatio, imageSize } = propsValue;

    const genAI = new GoogleGenAI({ apiKey: auth.secret_text });

    const response = await genAI.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio,
          imageSize,
        },
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData?.data
    );

    if (!imagePart?.inlineData?.data) {
      throw new Error('No image data returned from model response.');
    }

    const mimeType = imagePart.inlineData.mimeType ?? 'image/png';
    const extension = mime.extension(mimeType) || 'png';

    return await files.write({
      data: Buffer.from(imagePart.inlineData.data, 'base64'),
      fileName: `image.${extension}`,
    });
  },
});
