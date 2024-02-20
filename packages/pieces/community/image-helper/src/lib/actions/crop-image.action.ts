import { Property, createAction } from '@activepieces/pieces-framework';
import jimp from 'jimp';

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
    const image = await jimp.read(context.propsValue.image.data);
    await image.crop(context.propsValue.left, context.propsValue.top, context.propsValue.width, context.propsValue.height);
    
    const imageBuffer = await image.getBufferAsync(image.getMIME());

    const imageReference = await context.files.write({
      fileName: 'image.' + image.getExtension(),
      data: imageBuffer
    });

    return imageReference;
  },
});
