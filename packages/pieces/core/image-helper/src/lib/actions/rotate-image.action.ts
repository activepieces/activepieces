import { Property, createAction } from '@activepieces/pieces-framework';
import jimp from 'jimp';

export const rotateImage = createAction({
  audience: 'both',
  name: 'rotate_image',
  classification: 'READ',
  description: 'Turn an image clockwise by 90, 180 or 270 degrees.',
  aiMetadata: { description: 'Rotates an image clockwise by a fixed 90, 180, or 270 degrees and writes the result as a new file in the source format. Use it to reorient a photo or scan (get_meta_data can report the stored EXIF orientation first); use crop_image to trim edges or resize_image to change dimensions. Only those three degree values are accepted, so arbitrary angles are not supported; deterministic and idempotent.', idempotent: true },
  displayName: 'Rotate Image',
  props: {
    image: Property.File({
      displayName: 'Image',
      required: true,
    }),
    degree: Property.StaticDropdown({
      displayName: 'Angle',
      description: 'How far to turn the image clockwise.',
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
      description: 'File name for the result, without the extension.',
      required: false,
      advanced: true,
    }),
  },
  propertyGroups: [
    { key: 'source', display: 'section', label: 'Source', icon: 'file', props: ['image'] },
    { key: 'rotation', display: 'section', label: 'Rotation', icon: 'sliders', props: ['degree'] },
  ],
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
