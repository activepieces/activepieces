import { Property, createAction } from '@activepieces/pieces-framework';
import jimp from 'jimp';

export const compressImage = createAction({
  audience: 'both',
  name: 'compress_image',
  description: 'Compresses an image',
  aiMetadata: { description: 'Re-encodes an image file at a chosen quality level (high ~90 or lossy ~60), keeping the original pixel dimensions and the source file format, so pick it to shrink file size only - use resize_image to change dimensions or convert_image_format to change format. Requires an image file plus a quality and format choice, but the format choice only sets the output file extension while the pixels are re-encoded in the source format, and quality applies only to lossy JPEG-style encoding; deterministic and idempotent.', idempotent: true },
  displayName: 'Compresses an image',
  props: {
    image: Property.File({
      displayName: 'Image',
      required: true,
    }),
    quality: Property.StaticDropdown({
      displayName: 'Quality',
      description:
        'Specifies the quality of the image after compression (0-100).',
      required: true,
      options: {
        options: [
          { label: 'High Quality', value: 90 },
          { label: 'Lossy Quality', value: 60 },
        ],
      },
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'Specifies the format of the image after compression.',
      required: true,
      options: {
        options: [
          { label: 'JPG', value: 'jpg' },
          { label: 'PNG', value: 'png' },
        ],
      },
    }),
    resultFileName: Property.ShortText({
      displayName: 'Result File Name',
      description:
        'Specifies the output file name for the result image (without extension).',
      required: false,
    }),
  },
  async run(context) {
    const image = await jimp.read(context.propsValue.image.data);

    image.quality(context.propsValue.quality);

    const imageBuffer = await image.getBufferAsync(image.getMIME());

    const imageReference = await context.files.write({
      fileName:
        (context.propsValue.resultFileName ?? 'image') +
        '.' +
        context.propsValue.format,
      data: imageBuffer,
    });

    return imageReference;
  },
});
