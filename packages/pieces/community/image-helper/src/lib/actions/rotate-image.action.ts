import { Property, createAction } from '@activepieces/pieces-framework';
import sharp from 'sharp';

export const rotateImage = createAction({
  name: 'rotate_image',
  description: 'Rotates an image',
  displayName: 'Rotate an image',
  props: {
    image: Property.File({
      displayName: 'Image',
      required: true,
    }),
    degree: Property.StaticDropdown({
      displayName: 'Degree',
      description: 'Specifies the degree of rotation for the image. For clockwise rotation make the degree positive, otherwise make it negative.',
      required: true,
      options: {
        options: [
          { value: 90, label: '90°' },
          { value: 180, label: '180°' },
          { value: 270, label: '270°' },
        ]
      }
    }),
  },
  async run(context) {
    const rotatedImageBuffer = await sharp(context.propsValue.image.data)
      .rotate(context.propsValue.degree)
      .toBuffer();

    const format = (await sharp(context.propsValue.image.data).metadata()).format;

    const imageReference = await context.files.write({
      fileName: 'image.' + format,
      data: rotatedImageBuffer
    });

    return imageReference;
  },
});
