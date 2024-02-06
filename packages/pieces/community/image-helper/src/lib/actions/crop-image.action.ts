import { Property, createAction } from '@activepieces/pieces-framework';
import sharp from 'sharp';

export const cropImage = createAction({
  name: 'crop_image',
  description: 'Crops an image',
  displayName: 'Crop an image',
  props: {
    image: Property.File({
      displayName: 'Image',
      required: true,
    }),
    left: Property.Number({
      displayName: 'Left',
      description: 'Specifies the horizontal position, indicating where the cropping starts from the left side of the image.',
      required: true,
    }),
    top: Property.Number({
      displayName: 'Top',
      description: 'Represents the vertical position, indicating the starting point from the top of the image.',
      required: true,
    }),
    width: Property.Number({
      displayName: 'Width',
      description: 'Determines the horizontal size of the cropped area.',
      required: true,
    }),
    height: Property.Number({
      displayName: 'Height',
      description: 'Determines the vertical size of the cropped area.',
      required: true,
    }),
  },
  async run(context) {
    const croppedImageBuffer = await sharp(context.propsValue.image.data)
    .extract({
      left: context.propsValue.left,
      top: context.propsValue.top,
      width: context.propsValue.width,
      height: context.propsValue.height
    })
    .toBuffer();

    const format = (await sharp(context.propsValue.image.data).metadata()).format;

    const imageReference = await context.files.write({
      fileName: 'image.' + format,
      data: croppedImageBuffer
    });
  
    return imageReference;
  },
});
