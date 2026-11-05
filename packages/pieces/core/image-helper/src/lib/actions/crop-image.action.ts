import {
  MarkdownVariant,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import jimp from 'jimp';

export const cropImage = createAction({
  audience: 'both',
  name: 'crop_image',
  classification: 'READ',
  description: 'Cut out a rectangular area of an image.',
  aiMetadata: { description: 'Cuts a rectangular region out of an image file, given the left and top offset plus the width and height of the region in source pixels, and writes it as a new file in the original format. Choose this to trim or extract part of an image; use resize_image to scale the whole image instead, or rotate_image to reorient it. All four numeric bounds are required and must fall within the source dimensions - pure pixel computation and idempotent, so the same image and box always yield the same crop.', idempotent: true },
  displayName: 'Crop Image',
  props: {
    image: Property.File({
      displayName: 'Image',
      required: true,
    }),
    area_info: Property.MarkDown({
      value: 'All values are in pixels, measured from the top-left corner.',
      variant: MarkdownVariant.INFO,
    }),
    left: Property.Number({
      displayName: 'Left',
      description: 'Distance from the left edge.',
      required: true,
      width: 'half',
    }),
    top: Property.Number({
      displayName: 'Top',
      description: 'Distance from the top edge.',
      required: true,
      width: 'half',
    }),
    width: Property.Number({
      displayName: 'Width',
      description: 'Width of the area to keep.',
      required: true,
      width: 'half',
    }),
    height: Property.Number({
      displayName: 'Height',
      description: 'Height of the area to keep.',
      required: true,
      width: 'half',
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
    { key: 'area', display: 'section', label: 'Crop Area', icon: 'sliders', props: ['area_info', 'left', 'top', 'width', 'height'] },
  ],
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
