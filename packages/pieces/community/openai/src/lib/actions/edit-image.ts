import { Property, createAction } from '@activepieces/pieces-framework';
import OpenAI, { toFile } from 'openai';
import { randomBytes } from 'node:crypto';
import { kebabCase } from '@activepieces/shared';
import mime from 'mime-types';
import { openaiAuth } from '../auth';

export const editImage = createAction({
  auth: openaiAuth,
  name: 'edit_image',
  displayName: 'Edit Image',
  description: 'Edit an existing image using a text prompt with gpt-image-2',
  props: {
    image: Property.File({
      displayName: 'Image',
      description: 'The image to edit (PNG, JPEG, or WebP).',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'A description of the desired edits or the new image.',
      required: true,
    }),
    mask: Property.File({
      displayName: 'Mask',
      description:
        'Optional mask image. Transparent areas indicate where to apply edits. Must match the input image dimensions.',
      required: false,
    }),
    size: Property.StaticDropdown({
      displayName: 'Size',
      description: 'The size of the generated image.',
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
      description: 'Image quality level.',
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
  },
  async run(context) {
    const openai = new OpenAI({ apiKey: context.auth.secret_text });
    const { image, prompt, mask, size, quality } = context.propsValue;

    const imageMimeType = mime.lookup(image.extension ?? '') || 'image/png';
    const imageFile = await toFile(image.data, image.filename ?? 'image.png', {
      type: imageMimeType,
    });

    const params = {
      model: 'gpt-image-2',
      image: imageFile,
      prompt,
      ...(size && { size }),
      ...(quality && { quality }),
      ...(mask && {
        mask: await toFile(mask.data, mask.filename ?? 'mask.png', {
          type: mime.lookup(mask.extension ?? '') || 'image/png',
        }),
      }),
    };

    // quality and extended size values (auto, 1536x1024, 1024x1536) are not yet in SDK
    // types for images.edit but are accepted by the gpt-image-2 API
    const result = await openai.images.edit(
      params as Parameters<typeof openai.images.edit>[0]
    );

    const images = result.data ?? [];
    const savedImages = await Promise.all(
      images.map(async (img, index) => {
        if (!img.b64_json) throw new Error(`Image ${index + 1} has no base64 data`);
        const fileName = `${randomBytes(8).toString('hex')}-${kebabCase(prompt).slice(0, 40)}-${index + 1}.png`;
        const fileUrl = await context.files.write({
          fileName,
          data: Buffer.from(img.b64_json, 'base64'),
        });
        return { url: fileUrl, fileName };
      })
    );

    return { ...result, images: savedImages };
  },
});
