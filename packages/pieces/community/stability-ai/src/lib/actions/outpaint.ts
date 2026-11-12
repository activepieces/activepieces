import { createAction, Property } from '@activepieces/pieces-framework';
import { stabilityAiAuth } from '../auth';
import { stabilityClient } from '../common/client';
import { stabilityInput, stabilityProps } from '../common/props';
import { imageOutputSchema } from '../common/output-schemas';

function directionProp(displayName: string) {
  return Property.Number({
    displayName,
    description: `Pixels to add on the ${displayName.toLowerCase()} side, 0 to 2000.`,
    required: false,
  });
}

export const outpaint = createAction({
  auth: stabilityAiAuth,
  name: 'outpaint',
  classification: 'READ',
  displayName: 'Outpaint',
  description: 'Extend an image beyond its borders in any direction (4 credits).',
  audience: 'both',
  aiMetadata: {
    description:
      'Extends an image outward by the given number of pixels on the left, right, top (Up) or bottom (Down) side and fills the new area to match; at least one side must be above 0, at most 2000 each. An optional English prompt guides the new content. Costs 4 credits; each call is charged.',
    idempotent: false,
  },
  props: {
    image: stabilityProps.image({ displayName: 'Image', description: 'The image to extend.', required: true }),
    left: directionProp('Left'),
    right: directionProp('Right'),
    up: directionProp('Up'),
    down: directionProp('Down'),
    prompt: stabilityProps.prompt(false),
    creativity: Property.Number({
      displayName: 'Creativity',
      description: '0 to 1: how much new detail may be invented in the added area.',
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
    const left = stabilityInput.readNumber({ value: props.left, label: 'Left', min: 0, max: 2000, integer: true });
    const right = stabilityInput.readNumber({ value: props.right, label: 'Right', min: 0, max: 2000, integer: true });
    const up = stabilityInput.readNumber({ value: props.up, label: 'Up', min: 0, max: 2000, integer: true });
    const down = stabilityInput.readNumber({ value: props.down, label: 'Down', min: 0, max: 2000, integer: true });
    if (![left, right, up, down].some((value) => value !== undefined && value > 0)) {
      throw new Error('Set at least one of Left, Right, Up or Down to more than 0.');
    }
    return stabilityClient.generateImageFile({
      apiKey: context.auth.props.api_key,
      path: '/v2beta/stable-image/edit/outpaint',
      fields: {
        image,
        left,
        right,
        up,
        down,
        prompt: stabilityInput.readText(props.prompt),
        creativity: stabilityInput.readNumber({ value: props.creativity, label: 'Creativity', min: 0, max: 1 }),
        style_preset: stabilityInput.styleChoice(props.style_preset),
        seed: stabilityInput.readSeed(props.seed),
        output_format: stabilityInput.outputFormatChoice(props.output_format),
      },
      files: context.files,
      fileNamePrefix: 'outpainted',
      outputFileName: stabilityInput.readText(props.output_file_name),
    });
  },
});
