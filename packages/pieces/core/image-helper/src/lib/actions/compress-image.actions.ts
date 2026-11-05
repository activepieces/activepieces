import { Property, createAction } from '@activepieces/pieces-framework';
import jimp from 'jimp';

export const compressImage = createAction({
  audience: 'both',
  name: 'compress_image',
  classification: 'READ',
  description: 'Re-save a JPG image at a lower quality to shrink the file.',
  aiMetadata: { description: 'Re-encodes an image file at a chosen quality level (high ~90 or lossy ~60), keeping the original pixel dimensions and the source file format, so pick it to shrink file size only - use resize_image to change dimensions or convert_image_format to change format. Requires an image file plus a quality and format choice, but the format choice only sets the output file extension while the pixels are re-encoded in the source format, and quality applies only to lossy JPEG-style encoding; deterministic and idempotent.', idempotent: true },
  displayName: 'Compress Image',
  props: {
    image: Property.File({
      displayName: 'Image',
      required: true,
    }),
    quality: Property.StaticDropdown({
      displayName: 'Quality',
      description:
        'Applies to JPG images only; other formats are re-saved as they are.',
      required: true,
      display: 'cards',
      options: {
        options: [
          { label: 'High Quality', value: 90, description: 'Quality 90' },
          { label: 'Lower Quality', value: 60, description: 'Quality 60' },
        ],
      },
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description:
        'Sets the file extension only; the image keeps its original format.',
      required: true,
      display: 'cards',
      options: {
        options: [
          { label: 'JPG', value: 'jpg', description: '.jpg extension' },
          { label: 'PNG', value: 'png', description: '.png extension' },
        ],
      },
    }),
    resultFileName: Property.ShortText({
      displayName: 'Result File Name',
      description: 'File name for the result, without the extension.',
      required: false,
      advanced: true,
    }),
  },
  propertyGroups: [
    { key: 'source', display: 'section', label: 'Source', icon: 'file', props: ['image'] },
    { key: 'output', display: 'section', label: 'Output', icon: 'sliders', props: ['quality', 'format'] },
  ],
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
