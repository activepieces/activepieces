import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { kebabCase } from '@activepieces/pieces-framework';
import { randomBytes } from 'node:crypto';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';
import { generateImageActionOutputSchema } from '../output-schemas';

export const generateImage = createAction({
  audience: 'both',
  auth: openaiAuth,
  name: 'generate_image',
  classification: 'READ',
  displayName: 'Generate Image',
  description: 'Create an image from a text description.',
  aiMetadata: { description: 'Creates a brand new image from a text prompt using an image model available to the account (gpt-image or dall-e), saving each returned image as a file and reporting its URL. Resolution and quality both default to auto. Pick edit_image instead when an existing image is the starting point, and vision_prompt when the task is reading an image rather than producing one. Requires the prompt and a model id; not idempotent: each call renders a fresh image.', idempotent: false },
  props: {
    model: Property.Dropdown({
      auth: openaiAuth,
      displayName: 'Model',
      required: true,
      description: 'The OpenAI model that draws the image.',
      defaultValue: 'gpt-image-2',
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Enter your API key first',
            options: [],
          };
        }
        try {
          const openai = new OpenAI({ apiKey: auth.secret_text });
          const response = await openai.models.list();
          const imageModels = response.data
            .filter(
              (m) =>
                m.id.startsWith('gpt-image') || m.id.startsWith('dall-e')
            )
            .sort((a, b) => b.created - a.created);
          return {
            disabled: false,
            options: imageModels.map((m) => ({ label: m.id, value: m.id })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: "Couldn't load models. Check your API key or try again.",
          };
        }
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Describe the image you want.',
      placeholder: 'e.g. A watercolor fox in a snowy forest',
      required: true,
    }),
    resolution: Property.StaticDropdown({
      displayName: 'Size',
      description: 'Image shape. Auto lets the model choose.',
      required: false,
      defaultValue: 'auto',
      display: 'cards',
      options: {
        options: [
          { label: 'Auto', value: 'auto', description: 'Model picks' },
          { label: 'Square', value: '1024x1024', description: '1024 × 1024' },
          { label: 'Landscape', value: '1536x1024', description: '1536 × 1024' },
          { label: 'Portrait', value: '1024x1536', description: '1024 × 1536' },
        ],
      },
    }),
    quality: Property.StaticDropdown({
      displayName: 'Quality',
      required: false,
      description: 'Higher quality takes longer and costs more.',
      defaultValue: 'auto',
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
        ],
      },
    }),
  },
  outputSchema: generateImageActionOutputSchema,
  async run(context) {
    const openai = new OpenAI({ apiKey: context.auth.secret_text });
    const { quality, resolution, model, prompt } = context.propsValue;

    // quality and size include gpt-image values not yet in SDK types
    const response = await openai.images.generate({
      model,
      prompt,
      quality,
      size: resolution,
    } as Parameters<typeof openai.images.generate>[0]);

    const images = response.data ?? [];
    const savedImages = await Promise.all(
      images.map(async (img, index) => {
        let imageBuffer: Buffer;
        let ext = 'png';

        if (img.b64_json) {
          imageBuffer = Buffer.from(img.b64_json, 'base64');
        } else if (img.url) {
          const downloaded = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: img.url,
            responseType: 'arraybuffer',
          });
          imageBuffer = Buffer.from(downloaded.body);
          ext = img.url.split('.').pop()?.split('?')[0] ?? 'png';
        } else {
          throw new Error(`Image ${index + 1} has no URL or base64 data`);
        }

        const fileName = `${randomBytes(8).toString('hex')}-${kebabCase(prompt).slice(0, 40)}-${index + 1}.${ext}`;
        const fileUrl = await context.files.write({ fileName, data: imageBuffer });
        return { url: fileUrl, fileName, revised_prompt: img.revised_prompt };
      })
    );

    return { ...response, images: savedImages };
  },
});
