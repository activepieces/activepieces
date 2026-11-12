import { createAction, Property } from '@activepieces/pieces-framework';
import { stabilityAiAuth } from '../auth';
import { stabilityClient } from '../common/client';
import { stabilityInput, stabilityProps } from '../common/props';
import { imageOutputSchema } from '../common/output-schemas';

export const inpaint = createAction({
  auth: stabilityAiAuth,
  name: 'inpaint',
  classification: 'READ',
  displayName: 'Inpaint',
  description: 'Fill or replace the masked area of an image with new content from a prompt (5 credits).',
  audience: 'both',
  aiMetadata: {
    description:
      'Redraws the masked part of an image to match an English prompt and keeps the rest; costs 5 credits. Needs a mask image, or an image whose transparent pixels mark the area. When the object can be named instead of masked use Search and Replace; to only remove something use Erase Object. Each call is charged.',
    idempotent: false,
  },
  props: {
    image: stabilityProps.image({ displayName: 'Image', description: 'The image to edit.', required: true }),
    prompt: stabilityProps.prompt(true),
    mask: stabilityProps.image({
      displayName: 'Mask',
      description: 'Black and white image of the same size: white marks what to redraw. If empty, the transparent pixels of the image are used.',
      required: false,
    }),
    negative_prompt: stabilityProps.negativePrompt(),
    grow_mask: Property.Number({
      displayName: 'Grow Mask',
      description: '0 to 100 pixels to expand and soften the mask edges. Stability AI uses 5 when empty.',
      required: false,
    }),
    style_preset: stabilityProps.stylePreset(),
    seed: stabilityProps.seed(),
    output_format: stabilityProps.outputFormat(),
    output_file_name: stabilityProps.outputFileName(),
  },
  outputSchema: imageOutputSchema,
  async run(context) {
    const props = context.propsValue;
    const image = stabilityInput.readFile({ value: props.image, label: 'Image', required: true });
    const prompt = stabilityInput.requireText({ value: props.prompt, label: 'Prompt' });
    return stabilityClient.generateImageFile({
      apiKey: context.auth.props.api_key,
      path: '/v2beta/stable-image/edit/inpaint',
      fields: {
        image,
        prompt,
        mask: stabilityInput.readFile({ value: props.mask, label: 'Mask', required: false }),
        negative_prompt: stabilityInput.readText(props.negative_prompt),
        grow_mask: stabilityInput.readNumber({ value: props.grow_mask, label: 'Grow Mask', min: 0, max: 100 }),
        style_preset: stabilityInput.styleChoice(props.style_preset),
        seed: stabilityInput.readSeed(props.seed),
        output_format: stabilityInput.outputFormatChoice(props.output_format),
      },
      files: context.files,
      fileNamePrefix: 'inpainted',
      outputFileName: stabilityInput.readText(props.output_file_name),
    });
  },
});
