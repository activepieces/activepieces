import { createAction, Property, ApFile } from '@activepieces/pieces-framework';
import { imageRouterAuth } from '../auth';
import { imageRouterApi } from '../common/api';
import { imageRouterProps } from '../common/props';
import { randomBytes } from 'node:crypto';
import { kebabCase } from '@activepieces/pieces-framework';

export const imageToImageAction = createAction({
  audience: 'both',
  auth: imageRouterAuth,
  name: 'imageToImage',
  classification: 'READ',
  displayName: 'Image to Image',
  description: 'Generate or edit images using input image(s) with optional mask',
  aiMetadata: { description: 'Edits or transforms one to sixteen supplied image files against a text prompt via ImageRouter\'s image-edit endpoint, either rewriting the whole picture or, when mask files are attached, confining the changes to the masked areas (some models require a mask). Choose this whenever a source image must be sent - inpainting, style transfer, background swaps, multi-image composition; use Create Image when generating from a prompt with no input image. At least one image file is required and the selected model must support editing. Not idempotent: each call renders new output images.', idempotent: false },
  props: {
    prompt: Property.ShortText({
      displayName: 'Prompt',
      description: 'Text prompt describing the image transformation',
      required: true,
    }),
    model: imageRouterProps.model({ required: true }),
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

    const imageItems = inputImages ?? [];
    const maskItems = masks ?? [];

    if (!imageItems || imageItems.length === 0) {
      throw new Error('At least one input image is required');
    }

    if (imageItems.length > 16) {
      throw new Error('Maximum 16 images allowed');
    }

    const responseBody = await imageRouterApi.editImage({
      auth: context.auth,
      prompt,
      model,
      images: imageItems.flatMap((item) =>
        typeof item === 'object' && item !== null && 'image' in item && isFile(item.image) ? [item.image] : [],
      ),
      masks: maskItems.flatMap((item) =>
        typeof item === 'object' && item !== null && 'mask' in item && isFile(item.mask) ? [item.mask] : [],
      ),
      quality,
      size,
      responseFormat,
    });

    const generatedImages = responseBody.data || [];

    if (generatedImages.length === 0) {
      return responseBody;
    }

    const savedImages = await Promise.all(
      generatedImages.map(async (img, index) => {
        let imageBuffer: Buffer;
        let fileName: string;

        if (img.b64_json) {
          imageBuffer = Buffer.from(img.b64_json, 'base64');
          fileName = `${randomBytes(8).toString('hex')}-${kebabCase(prompt).slice(0, 40)}-${index + 1}.png`;
        } else if (img.url) {
          imageBuffer = await imageRouterApi.downloadFile({ url: img.url });
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

function isFile(value: unknown): value is ApFile {
  return typeof value === 'object' && value !== null && 'filename' in value && 'data' in value;
}
