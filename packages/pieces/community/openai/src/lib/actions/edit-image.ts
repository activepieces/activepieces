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
  description: 'Edit an existing image using OpenAI.',
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'The base URL for the OpenAI API. Default is https://api.openai.com/v1',
      required: false,
    }),
    image: Property.File({
      displayName: 'Image',
      description: 'The image to edit.',
      required: true,
    }),
    mask: Property.File({
      displayName: 'Mask (Optional)',
      description: 'An additional image whose fully transparent areas indicate where image should be edited.',
      required: false,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'A text description of the desired image(s).',
      required: true,
    }),
    n: Property.Number({
      displayName: 'Number of Images',
      description: 'The number of images to generate. Must be between 1 and 10.',
      required: false,
      defaultValue: 1,
    }),
    size: Property.StaticDropdown({
      displayName: 'Size',
      description: 'The size of the generated images.',
      required: false,
      defaultValue: '1024x1024',
      options: {
        options: [
          { label: '256x256', value: '256x256' },
          { label: '512x512', value: '512x512' },
          { label: '1024x1024', value: '1024x1024' },
        ],
      },
    }),
    response_format: Property.StaticDropdown({
      displayName: 'Response Format',
      description: 'The format in which the generated images are returned.',
      required: false,
      defaultValue: 'b64_json',
      options: {
        options: [
          { label: 'URL', value: 'url' },
          { label: 'Base64 JSON', value: 'b64_json' },
        ],
      },
    }),
  },
  async run(context) {
    const openai = new OpenAI({
      apiKey: context.auth as string,
      baseURL: context.propsValue.baseUrl || undefined,
    });
    const { image, mask, prompt, n, size, response_format } = context.propsValue;

    const imageFile = await horrorToFile(image);
    const maskFile = mask ? await horrorToFile(mask) : undefined;

    const result = await openai.images.edit({
      image: imageFile,
      mask: maskFile,
      prompt,
      n: n ?? undefined,
      size: size as any,
      response_format: response_format as any,
    });

    const savedImages = await Promise.all(
      result.data.map(async (img: any, index) => {
        if (response_format === 'url') {
          return { url: img.url };
        }
        const fileName = `${kebabCase(prompt)}-${index}.png`;
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

async function horrorToFile(apFile: any) {
  const extension = mime.extension(apFile.extension || 'image/png') || 'png';
  return await toFile(apFile.data, `image-${randomBytes(4).toString('hex')}.${extension}`);
}
