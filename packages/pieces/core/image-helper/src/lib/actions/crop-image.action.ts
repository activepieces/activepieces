import { Property, createAction } from '@activepieces/pieces-framework';
import jimp from 'jimp';

export const cropImage = createAction({
  audience: 'both',
  name: 'crop_image',
  description: 'Crops an image',
  aiMetadata: { description: 'Cuts a rectangular region out of an image file, given the left and top offset plus the width and height of the region in source pixels, and writes it as a new file in the original format. Choose this to trim or extract part of an image; use resize_image to scale the whole image instead, or rotate_image to reorient it. All four numeric bounds are required and must fall within the source dimensions - pure pixel computation and idempotent, so the same image and box always yield the same crop.', idempotent: true },
  displayName: 'Crop an image',
  props: {
    image: Property.File({
      displayName: 'Image',
      required: true,
    }),
    left: Property.Number({
      displayName: 'Left',
      description:
        'Specifies the horizontal position, indicating where the cropping starts from the left side of the image.',
      required: true,
    }),
    top: Property.Number({
      displayName: 'Top',
      description:
        'Represents the vertical position, indicating the starting point from the top of the image.',
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
    resultFileName: Property.ShortText({
      displayName: 'Result File Name',
      description:
        'Specifies the output file name for the cropped image (without extension).',
      required: false,
    }),
  },
  async run(context) {
    const image = await jimp.read(context.propsValue.image.data);
    await image.crop(
      context.propsValue.left,
      context.propsValue.top,
      context.propsValue.width,
      context.propsValue.height
    );

    const imageBuffer = await image.getBufferAsync(image.getMIME());

    const fileName =
      (context.propsValue.resultFileName ?? 'image') +
      '.' +
      image.getExtension();

    const imageReference = await context.files.write({
      fileName: fileName,
      data: imageBuffer,
    });

    return imageReference;
  },
});
