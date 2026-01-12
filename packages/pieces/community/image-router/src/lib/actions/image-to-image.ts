import { createAction, Property, ApFile } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { imageRouterAuth } from '../common/auth';
import { modelDropdown } from '../common/props';
import { BASE_URL } from '../common/client';
import FormData from 'form-data';
import { randomBytes } from 'node:crypto';
import { kebabCase } from '@activepieces/shared';

interface ImageItem {
  image: ApFile;
}

interface MaskItem {
  mask: ApFile;
}

export const imageToImage = createAction({
  auth: imageRouterAuth,
  name: 'imageToImage',
  displayName: 'Image to Image',
  description: 'Generate or edit images using input image(s) with optional mask',
  props: {
    prompt: Property.ShortText({
      displayName: 'Prompt',
      description: 'Text prompt describing the image transformation',
      required: true,
    }),
    model: modelDropdown,
    images: Property.Array({
      displayName: 'Input Images',
      description: 'Input image(s) for editing (up to 16 images)',
      required: true,
      properties: {
        image: Property.File({
          displayName: 'Image',
          description: 'Input image file',
          required: true,
        }),
      },
    }),
    masks: Property.Array({
      displayName: 'Masks',
      description: 'Mask file(s) to specify areas to edit (some models require this)',
      required: false,
      properties: {
        mask: Property.File({
          displayName: 'Mask',
          description: 'Mask image file',
          required: true,
        }),
      },
    }),
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
    const { prompt, model, images: inputImages, masks, quality, size, responseFormat } = context.propsValue;

    const imageItems = (inputImages as ImageItem[]) ?? [];
    const maskItems = (masks as MaskItem[]) ?? [];

    if (!imageItems || imageItems.length === 0) {
      throw new Error('At least one input image is required');
    }

    if (imageItems.length > 16) {
      throw new Error('Maximum 16 images allowed');
    }

    const formData = new FormData();

    formData.append('prompt', prompt);
    formData.append('model', model);

    for (const imageItem of imageItems) {
      if (imageItem.image) {
        formData.append('image[]', Buffer.from(imageItem.image.data), imageItem.image.filename);
      }
    }

    if (maskItems && maskItems.length > 0) {
      for (const maskItem of maskItems) {
        if (maskItem.mask) {
          formData.append('mask[]', Buffer.from(maskItem.mask.data), maskItem.mask.filename);
        }
      }
    }

    if (quality && quality !== 'auto') {
      formData.append('quality', quality);
    }

    if (size && size !== 'auto') {
      formData.append('size', size);
    }

    if (responseFormat && responseFormat !== 'url') {
      formData.append('response_format', responseFormat);
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/v1/openai/images/edits`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (response.status >= 400) {
      const errorMessage = (response.body as any)?.error?.message || 
                          (response.body as any)?.message || 
                          `ImageRouter API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    const responseBody = response.body as {
      data?: Array<{
        url?: string;
        b64_json?: string;
        revised_prompt?: string;
      }>;
    };

    const generatedImages = responseBody.data || [];

    if (generatedImages.length === 0) {
      return responseBody;
    }

    const savedImages = await Promise.all(
      generatedImages.map(async (img: { url?: string; b64_json?: string; revised_prompt?: string }, index: number) => {
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
      ...responseBody,
      images: savedImages,
    };
  },
});

