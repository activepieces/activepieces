import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { kebabCase } from '@activepieces/shared';
import { randomBytes } from 'node:crypto';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';

export const generateImage = createAction({
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
      defaultValue: 'dall-e-3',
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'GPT Image 2', value: 'gpt-image-2' },
            { label: 'DALL-E 3', value: 'dall-e-3' },
            { label: 'DALL-E 2', value: 'dall-e-2' },
          ],
        };
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
    resolution: Property.Dropdown({
      auth: openaiAuth,
      displayName: 'Resolution',
      description: 'The resolution to generate the image in.',
      required: false,
      refreshers: ['model'],
      defaultValue: '1024x1024',
      options: async ({ model }) => {
        if (model === 'gpt-image-2') {
          return {
            options: [
              { label: 'Auto', value: 'auto' },
              { label: '1024x1024', value: '1024x1024' },
              { label: '1536x1024 (landscape)', value: '1536x1024' },
              { label: '1024x1536 (portrait)', value: '1024x1536' },
            ],
          };
        }
        if (model === 'dall-e-3') {
          return {
            options: [
              { label: '1024x1024', value: '1024x1024' },
              { label: '1024x1792', value: '1024x1792' },
              { label: '1792x1024', value: '1792x1024' },
            ],
          };
        }
        return {
          options: [
            { label: '1024x1024', value: '1024x1024' },
            { label: '512x512', value: '512x512' },
            { label: '256x256', value: '256x256' },
          ],
        };
      },
    }),
    quality: Property.Dropdown({
      auth: openaiAuth,
      displayName: 'Quality',
      required: false,
      description: 'Image quality level.',
      defaultValue: 'auto',
      refreshers: ['model'],
      options: async ({ model }) => {
        if (model === 'gpt-image-2') {
          return {
            options: [
              { label: 'Auto', value: 'auto' },
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
            ],
          };
        }
        return {
          options: [
            { label: 'Standard', value: 'standard' },
            { label: 'HD', value: 'hd' },
          ],
        };
      },
    }),
  },
  async run(context) {
    const openai = new OpenAI({ apiKey: context.auth.secret_text });
    const { quality, resolution, model, prompt } = context.propsValue;

    const dalleQualities = new Set(['standard', 'hd']);
    const gptImageQualities = new Set(['auto', 'low', 'medium', 'high']);
    const effectiveQuality =
      (model === 'gpt-image-2' && !gptImageQualities.has(quality ?? '')) ||
      (model !== 'gpt-image-2' && !dalleQualities.has(quality ?? ''))
        ? undefined
        : quality;

    const dalleResolutions = new Set(['256x256', '512x512', '1024x1024', '1024x1792', '1792x1024']);
    const gptImageResolutions = new Set(['auto', '1024x1024', '1536x1024', '1024x1536']);
    const validResolutions = model === 'gpt-image-2' ? gptImageResolutions : dalleResolutions;
    const effectiveSize = resolution && validResolutions.has(resolution) ? resolution : undefined;

    // quality and size include gpt-image-2 values not yet in SDK types
    const response = await openai.images.generate({
      model,
      prompt,
      quality: effectiveQuality,
      size: effectiveSize,
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
