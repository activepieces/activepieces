import { Property, createAction } from '@activepieces/pieces-framework';
import OpenAI, { toFile } from 'openai';
import { randomBytes } from 'node:crypto';
import { kebabCase } from '@activepieces/pieces-framework';
import mime from 'mime-types';
import { openaiAuth } from '../auth';
import { editImageActionOutputSchema } from '../output-schemas';

export const editImage = createAction({
  audience: 'both',
  auth: openaiAuth,
  name: 'edit_image',
  classification: 'READ',
  displayName: 'Edit Image',
  description: 'Change an image by describing the edit.',
  aiMetadata: { description: 'Modifies an existing image supplied as a file, applying the changes described in a text prompt with the gpt-image-2 model, and writes the result out as a new PNG file. An optional mask image confines the edit to its transparent areas and must match the dimensions of the input image; size and quality can be left on auto. Pick generate_image instead when there is no source image to start from, and vision_prompt when the image only needs to be read rather than changed. Not idempotent: each call renders a fresh image.', idempotent: false },
  props: {
    image: Property.File({
      displayName: 'Image',
      description: 'PNG, JPEG or WebP image to edit.',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Describe the change you want.',
      placeholder: 'e.g. Replace the sky with a sunset',
      required: true,
    }),
    size: Property.StaticDropdown({
      displayName: 'Size',
      description: 'Image shape. Auto lets the model choose.',
      required: false,
      defaultValue: 'auto',
      display: 'cards',
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Square', value: '1024x1024', description: '1024 × 1024' },
          { label: 'Landscape', value: '1536x1024', description: '1536 × 1024' },
          { label: 'Portrait', value: '1024x1536', description: '1024 × 1536' },
        ],
      },
    }),
    quality: Property.StaticDropdown({
      displayName: 'Quality',
      description: 'Higher quality takes longer and costs more.',
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
    mask: Property.File({
      displayName: 'Mask',
      description: 'Transparent areas mark where to edit. Same size as the image.',
      required: false,
      advanced: true,
    }),
  },
  outputSchema: editImageActionOutputSchema,
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
