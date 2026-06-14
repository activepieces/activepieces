import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { kebabCase } from '@activepieces/shared';
import { randomBytes } from 'node:crypto';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';

export const generateImage = createAction({
  audience: 'human',
  auth: openaiAuth,
  name: 'generate_image',
  displayName: 'Generate Image',
  description: 'Generate an image using text-to-image models',
  props: {
    model: Property.Dropdown({
      auth: openaiAuth,
      displayName: 'Model',
      required: true,
      description: 'The model which will generate the image.',
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
      required: true,
    }),
    resolution: Property.StaticDropdown({
      displayName: 'Resolution',
      description: 'The resolution to generate the image in.',
      required: false,
      defaultValue: 'auto',
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: '1024x1024', value: '1024x1024' },
          { label: '1536x1024 (landscape)', value: '1536x1024' },
          { label: '1024x1536 (portrait)', value: '1024x1536' },
        ],
      },
    }),
    quality: Property.StaticDropdown({
      displayName: 'Quality',
      required: false,
      description: 'Image quality level.',
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
