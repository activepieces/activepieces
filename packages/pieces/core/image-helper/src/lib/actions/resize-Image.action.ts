import { Property, createAction } from '@activepieces/pieces-framework';
import jimp from 'jimp';

export const resizeImage = createAction({
  audience: 'both',
  name: 'resize_image',
  description: 'Resizes an image',
  aiMetadata: { description: 'Scales an image to an explicit pixel width and height, or to a width with the height derived automatically when the maintain-aspect-ratio option is set, writing the result as a new file in the source format. Pick this to change dimensions; use compress_image when the dimensions are fine and only file size must drop, or crop_image to cut out a region instead of squeezing the whole frame. Width and height are both required numbers even when aspect ratio is maintained (height is then ignored), and mismatched ratios stretch rather than letterbox the image; deterministic and idempotent.', idempotent: true },
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
      displayName: 'Maintain aspect ratio for height',
      required: false,
      defaultValue: false,
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
    await image.resize(
      context.propsValue.width,
      context.propsValue.aspectRatio ? jimp.AUTO : context.propsValue.height
    );

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
