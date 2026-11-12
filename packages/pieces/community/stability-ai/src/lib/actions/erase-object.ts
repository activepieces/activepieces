import { createAction, Property } from '@activepieces/pieces-framework';
import { stabilityAiAuth } from '../auth';
import { stabilityClient } from '../common/client';
import { stabilityInput, stabilityProps } from '../common/props';
import { imageOutputSchema } from '../common/output-schemas';

export const eraseObject = createAction({
  auth: stabilityAiAuth,
  name: 'erase_object',
  classification: 'READ',
  displayName: 'Erase Object',
  description: 'Remove unwanted objects, blemishes or text from an image using a mask (5 credits).',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes the masked area of an image (objects, blemishes, text) and fills it in to match the surroundings; costs 5 credits. Needs a mask image, or an image whose transparent pixels mark the area. To replace something with new content use Inpaint or Search and Replace. Each call is charged.',
    idempotent: false,
  },
  props: {
    image: stabilityProps.image({ displayName: 'Image', description: 'The image to clean up.', required: true }),
    mask: stabilityProps.image({
      displayName: 'Mask',
      description: 'Black and white image of the same size: white marks what to erase. If empty, the transparent pixels of the image are used.',
      required: false,
    }),
    grow_mask: Property.Number({
      displayName: 'Grow Mask',
      description: '0 to 20 pixels to expand and soften the mask edges. Stability AI uses 5 when empty.',
      required: false,
    }),
    seed: stabilityProps.seed(),
    output_format: stabilityProps.outputFormat(),
    output_file_name: stabilityProps.outputFileName(),
  },
  outputSchema: imageOutputSchema,
  async run(context) {
    const props = context.propsValue;
    return stabilityClient.generateImageFile({
      apiKey: context.auth.props.api_key,
      path: '/v2beta/stable-image/edit/erase',
      fields: {
        image: stabilityInput.readFile({ value: props.image, label: 'Image', required: true }),
        mask: stabilityInput.readFile({ value: props.mask, label: 'Mask', required: false }),
        grow_mask: stabilityInput.readNumber({ value: props.grow_mask, label: 'Grow Mask', min: 0, max: 20 }),
        seed: stabilityInput.readSeed(props.seed),
        output_format: stabilityInput.outputFormatChoice(props.output_format),
      },
      files: context.files,
      fileNamePrefix: 'erased',
      outputFileName: stabilityInput.readText(props.output_file_name),
    });
  },
});
