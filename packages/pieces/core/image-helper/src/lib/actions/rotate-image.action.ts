import { Property, createAction } from '@activepieces/pieces-framework';
import jimp from 'jimp';

export const rotateImage = createAction({
  audience: 'both',
  name: 'rotate_image',
  description: 'Rotates an image',
  aiMetadata: { description: 'Rotates an image clockwise by a fixed 90, 180, or 270 degrees and writes the result as a new file in the source format. Use it to reorient a photo or scan (get_meta_data can report the stored EXIF orientation first); use crop_image to trim edges or resize_image to change dimensions. Only those three degree values are accepted, so arbitrary angles are not supported; deterministic and idempotent.', idempotent: true },
  displayName: 'Rotate an image',
  props: {
    image: Property.File({
      displayName: 'Image',
      required: true,
    }),
    degree: Property.StaticDropdown({
      displayName: 'Degree',
      description:
        'Specifies the degree of clockwise rotation applied to the image.',
      required: true,
      options: {
        options: [
          { value: 90, label: '90°' },
          { value: 180, label: '180°' },
          { value: 270, label: '270°' },
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
    await image.rotate(-context.propsValue.degree);

    const imageBuffer = await image.getBufferAsync(image.getMIME());

    const imageReference = await context.files.write({
      fileName:
        (context.propsValue.resultFileName ?? 'image') +
        '.' +
        image.getExtension(),
      data: imageBuffer,
    });

    return imageReference;
  },
});
