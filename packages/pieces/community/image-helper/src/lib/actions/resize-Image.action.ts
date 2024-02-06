import { Property, createAction } from '@activepieces/pieces-framework';
import sharp from 'sharp';

export const resizeImage = createAction({
  name: 'resize_image',
  description: 'Resizes an image',
  displayName: 'Resize an image',
  props: {
    image: Property.File({
      displayName: 'Image',
      required: true,
    }),
    width: Property.Number({
      displayName: 'Width',
      description: 'Specifies the width of the image.',
      required: true,
    }),
    height: Property.Number({
      displayName: 'Height',
      description: 'Specifies the height of the image.',
      required: true,
    }),
    aspectRatio: Property.Checkbox({
      displayName: 'Maintain aspect ratio',
      required: false,
      defaultValue: false,
    })
  },
  async run(context) {
    const resizedImageBuffer = await sharp(context.propsValue.image.data)
    .resize({width: context.propsValue.width, height: context.propsValue.height, fit: context.propsValue.aspectRatio ? 'inside' : 'fill'})
    .toBuffer();

    const format = (await sharp(context.propsValue.image.data).metadata()).format;

    const imageReference = await context.files.write({
      fileName: 'image.' + format,
      data: resizedImageBuffer
    });
  
    return imageReference;
  },
});
