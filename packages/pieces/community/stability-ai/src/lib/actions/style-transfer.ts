import { createAction, Property } from '@activepieces/pieces-framework';
import { stabilityAiAuth } from '../auth';
import { stabilityClient } from '../common/client';
import { stabilityInput, stabilityProps } from '../common/props';
import { imageOutputSchema } from '../common/output-schemas';

export const styleTransfer = createAction({
  auth: stabilityAiAuth,
  name: 'style_transfer',
  classification: 'READ',
  displayName: 'Style Transfer',
  description: 'Restyle an image with the look of a second image while keeping its content (8 credits).',
  audience: 'both',
  aiMetadata: {
    description:
      'Applies the visual style of a Style Image to an Init Image while keeping the content and layout of the Init Image; an optional English prompt adds guidance. Costs 8 credits. To create a brand-new image in a given style use Style Guide. Each call is charged.',
    idempotent: false,
  },
  props: {
    init_image: stabilityProps.image({ displayName: 'Init Image', description: 'The image whose content to keep.', required: true }),
    style_image: stabilityProps.image({ displayName: 'Style Image', description: 'The image whose style to apply.', required: true }),
    prompt: stabilityProps.prompt(false),
    negative_prompt: stabilityProps.negativePrompt(),
    style_strength: Property.Number({
      displayName: 'Style Strength',
      description: '0 to 1: how strongly the style is applied. Stability AI uses 1 when empty.',
      required: false,
    }),
    composition_fidelity: Property.Number({
      displayName: 'Composition Fidelity',
      description: '0 to 1: how closely the layout of the Init Image is kept. Stability AI uses 0.9 when empty.',
      required: false,
    }),
    change_strength: Property.Number({
      displayName: 'Change Strength',
      description: '0.1 to 1: how much the Init Image may change. Stability AI uses 0.9 when empty.',
      required: false,
    }),
    seed: stabilityProps.seed(),
    output_format: stabilityProps.outputFormat(),
    output_file_name: stabilityProps.outputFileName(),
  },
  outputSchema: imageOutputSchema,
  async run(context) {
    const props = context.propsValue;
    const initImage = stabilityInput.readFile({ value: props.init_image, label: 'Init Image', required: true });
    const styleImage = stabilityInput.readFile({ value: props.style_image, label: 'Style Image', required: true });
    return stabilityClient.generateImageFile({
      apiKey: context.auth.props.api_key,
      path: '/v2beta/stable-image/control/style-transfer',
      fields: {
        init_image: initImage,
        style_image: styleImage,
        prompt: stabilityInput.readText(props.prompt),
        negative_prompt: stabilityInput.readText(props.negative_prompt),
        style_strength: stabilityInput.readNumber({ value: props.style_strength, label: 'Style Strength', min: 0, max: 1 }),
        composition_fidelity: stabilityInput.readNumber({
          value: props.composition_fidelity,
          label: 'Composition Fidelity',
          min: 0,
          max: 1,
        }),
        change_strength: stabilityInput.readNumber({ value: props.change_strength, label: 'Change Strength', min: 0.1, max: 1 }),
        seed: stabilityInput.readSeed(props.seed),
        output_format: stabilityInput.outputFormatChoice(props.output_format),
      },
      files: context.files,
      fileNamePrefix: 'style-transfer',
      outputFileName: stabilityInput.readText(props.output_file_name),
    });
  },
});
