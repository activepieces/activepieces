import { randomBytes } from 'node:crypto';

import { createAction, MarkdownVariant, Property, ApFile } from '@activepieces/pieces-framework';
import { kebabCase } from '@activepieces/pieces-framework';

import { imageRouterAuth } from '../auth';
import { imageRouterApi } from '../common/api';
import { imageRouterProps } from '../common/props';
import { createImageOutputSchema } from '../output-schemas';

export const imageToImageAction = createAction({
  audience: 'human',
  auth: imageRouterAuth,
  name: 'imageToImage',
  outputSchema: createImageOutputSchema,
  classification: 'WRITE',
  displayName: 'Image to Image',
  description: 'Generate or edit images using input image(s) with optional mask',
  aiMetadata: { description: 'Edits or transforms one to sixteen supplied image files against a text prompt via ImageRouter\'s image-edit endpoint, either rewriting the whole picture or, when mask files are attached, confining the changes to the masked areas (some models require a mask). Choose this whenever a source image must be sent - inpainting, style transfer, background swaps, multi-image composition; use Create Image when generating from a prompt with no input image. At least one image file is required and the selected model must support editing. Not idempotent: each call renders new output images.', idempotent: false },
  propertyGroups: [
    { key: 'request', display: 'section', label: 'What to Change', icon: 'text', props: ['prompt', 'model'] },
    { key: 'sources', display: 'section', label: 'Source Images', icon: 'paperclip', props: ['images', 'masks'] },
    { key: 'output', display: 'section', label: 'Output', icon: 'sliders', props: ['outputNote', 'quality', 'size', 'responseFormat'] },
  ],
  props: {
    prompt: Property.ShortText({
      displayName: 'Prompt',
      description: 'What to change in the images.',
      placeholder: 'Swap the background for a beach',
      required: true,
    }),
    model: imageRouterProps.model({ required: true }),
    images: Property.Array({
      displayName: 'Input Images',
      description: 'Up to 16 images to edit or combine.',
      required: true,
      properties: {
        image: Property.File({
          displayName: 'Image',
          required: true,
        }),
      },
    }),
    masks: Property.Array({
      displayName: 'Masks',
      description: 'Images marking the areas to change. Some models need one.',
      required: false,
      properties: {
        mask: Property.File({
          displayName: 'Mask',
          required: true,
        }),
      },
    }),
    outputNote: Property.MarkDown({
      value: 'Quality and size apply only to models that support them.',
      variant: MarkdownVariant.INFO,
    }),
    quality: Property.StaticDropdown({
      displayName: 'Quality',
      description: 'Auto uses the model\'s default.',
      width: 'half',
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
      description: 'Width x height, e.g. 1024x1024, or auto.',
      width: 'half',
      required: false,
      defaultValue: 'auto',
    }),
    responseFormat: Property.StaticDropdown({
      displayName: 'Response Format',
      description: 'The step saves the image as a file either way.',
      display: 'cards',
      required: false,
      defaultValue: 'url',
      options: {
        options: [
          { label: 'URL', value: 'url', description: 'Logged link', icon: 'file' },
          { label: 'Base64', value: 'b64_json', description: 'Logged data', icon: 'code' },
          { label: 'Unlogged Base64', value: 'b64_ephemeral', description: 'Image data, not logged', icon: 'code' },
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
