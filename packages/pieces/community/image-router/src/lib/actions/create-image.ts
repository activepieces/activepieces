import { randomBytes } from 'node:crypto';

import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { kebabCase } from '@activepieces/pieces-framework';

import { imageRouterAuth } from '../auth';
import { imageRouterApi } from '../common/api';
import { imageRouterProps } from '../common/props';
import { createImageOutputSchema } from '../output-schemas';

export const createImageAction = createAction({
  audience: 'human',
  auth: imageRouterAuth,
  name: 'createImage',
  outputSchema: createImageOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Image',
  description: 'Generate an image from a text prompt using any available model',
  aiMetadata: { description: 'Generates brand-new images from a text prompt alone, routing the request through ImageRouter to whichever hosted image model is named in the required Model input, then downloading each result and saving it as a flow file. Pick this when there is no source picture to work from; use Image to Image instead to edit, mask, or transform images you already have. Quality and size are advisory and are ignored by models that do not support them. Not idempotent: each call runs a fresh generation and returns different images.', idempotent: false },
  propertyGroups: [
    { key: 'request', display: 'section', label: 'What to Create', icon: 'text', props: ['prompt', 'model'] },
    { key: 'output', display: 'section', label: 'Output', icon: 'sliders', props: ['outputNote', 'quality', 'size', 'responseFormat'] },
  ],
  props: {
    prompt: Property.ShortText({
      displayName: 'Prompt',
      description: 'What the image should show.',
      placeholder: 'A red fox in a snowy forest at golden hour',
      required: true,
    }),
    model: imageRouterProps.model({ required: true }),
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
    const { prompt, model, quality, size, responseFormat } = context.propsValue;

    const response = await imageRouterApi.generateImage({
      auth: context.auth,
      prompt,
      model,
      quality,
      size,
      responseFormat,
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
      ...response,
      images: savedImages,
    };
  },
});

