import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { imageRouterAuth } from '../common/auth';
import { imageRouterApiCall } from '../common/client';
import { modelDropdown } from '../common/props';
import { randomBytes } from 'node:crypto';
import { kebabCase } from '@activepieces/shared';

export const createImage = createAction({
  auth: imageRouterAuth,
  name: 'createImage',
  displayName: 'Create Image',
  description: 'Generate an image from a text prompt using any available model',
  props: {
    prompt: Property.ShortText({
      displayName: 'Prompt',
      description: 'Text prompt describing the image you want to generate',
      required: true,
    }),
    model: modelDropdown,
    quality: Property.StaticDropdown({
      displayName: 'Quality',
      description: 'Image quality (not all models support this)',
      required: false,
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
    size: Property.ShortText({
      displayName: 'Size',
      description: 'Image size (e.g., 1024x1024). Use "auto" for default size.',
      required: false,
      defaultValue: 'auto',
    }),
    responseFormat: Property.StaticDropdown({
      displayName: 'Response Format',
      description: 'How to receive the generated image',
      required: false,
      defaultValue: 'url',
      options: {
        options: [
          { label: 'URL (saved in logs)', value: 'url' },
          { label: 'Base64 JSON (saved in logs)', value: 'b64_json' },
          { label: 'Base64 Ephemeral (not saved)', value: 'b64_ephemeral' },
        ],
      },
    }),
  },
  async run(context) {
    const { prompt, model, quality, size, responseFormat } = context.propsValue;

    const body: any = {
      prompt,
      model,
    };

    if (quality && quality !== 'auto') {
      body.quality = quality;
    }

    if (size && size !== 'auto') {
      body.size = size;
    }

    if (responseFormat && responseFormat !== 'url') {
      body.response_format = responseFormat;
    }

    const response = await imageRouterApiCall<{
      data?: Array<{
        url?: string;
        b64_json?: string;
        revised_prompt?: string;
      }>;
    }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: '/v1/openai/images/generations',
      body,
    });

    const images = response.data || [];

    if (images.length === 0) {
      return response;
    }

    const savedImages = await Promise.all(
      images.map(async (img, index) => {
        let imageBuffer: Buffer;
        let fileName: string;

        if (img.b64_json) {
          imageBuffer = Buffer.from(img.b64_json, 'base64');
          fileName = `${randomBytes(8).toString('hex')}-${kebabCase(prompt).slice(0, 40)}-${index + 1}.png`;
        } else if (img.url) {
          const downloadResponse = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: img.url,
            responseType: 'arraybuffer',
          });
          imageBuffer = Buffer.from(downloadResponse.body);
          const urlExtension = img.url.split('.').pop()?.split('?')[0] || 'png';
          fileName = `${randomBytes(8).toString('hex')}-${kebabCase(prompt).slice(0, 40)}-${index + 1}.${urlExtension}`;
        } else {
          throw new Error(`Image ${index + 1} has no URL or base64 data`);
        }

        const fileUrl = await context.files.write({
          fileName,
          data: imageBuffer,
        });

        return {
          index: index + 1,
          url: img.url || null,
          b64_json: img.b64_json || null,
          revised_prompt: img.revised_prompt || prompt,
          savedFile: fileUrl,
          fileName,
        };
      })
    );

    return {
      ...response,
      images: savedImages,
    };
  },
});

