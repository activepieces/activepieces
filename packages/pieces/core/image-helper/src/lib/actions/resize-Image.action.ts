import {
  MarkdownVariant,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import jimp from 'jimp';

export const resizeImage = createAction({
  audience: 'both',
  name: 'resize_image',
  classification: 'READ',
  description: 'Change the width and height of an image.',
  aiMetadata: { description: 'Scales an image to an explicit pixel width and height, or to a width with the height derived automatically when the maintain-aspect-ratio option is set, writing the result as a new file in the source format. Pick this to change dimensions; use compress_image when the dimensions are fine and only file size must drop, or crop_image to cut out a region instead of squeezing the whole frame. Width and height are both required numbers even when aspect ratio is maintained (height is then ignored), and mismatched ratios stretch rather than letterbox the image; deterministic and idempotent.', idempotent: true },
  displayName: 'Resize Image',
  props: {
    image: Property.File({
      displayName: 'Image',
      required: true,
    }),
    size_info: Property.MarkDown({
      value: 'Sizes are in pixels.',
      variant: MarkdownVariant.INFO,
    }),
    width: Property.Number({
      displayName: 'Width',
      required: true,
      width: 'half',
    }),
    height: Property.Number({
      displayName: 'Height',
      required: true,
      width: 'half',
    }),
    aspectRatio: Property.Checkbox({
      displayName: 'Keep Aspect Ratio',
      description: 'Height follows the width, and the Height value is ignored.',
      required: false,
      defaultValue: false,
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
    { key: 'size', display: 'section', label: 'Size', icon: 'sliders', props: ['size_info', 'width', 'height', 'aspectRatio'] },
  ],
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
