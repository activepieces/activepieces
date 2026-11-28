import { createAction, Property } from '@activepieces/pieces-framework';
import { stabilityAiAuth } from '../auth';
import { stabilityClient } from '../common/client';
import { stabilityInput, stabilityProps } from '../common/props';
import { imageOutputSchema } from '../common/output-schemas';

export const structureToImage = createAction({
  auth: stabilityAiAuth,
  name: 'structure_to_image',
  classification: 'READ',
  displayName: 'Structure to Image',
  description: 'Create a new image that keeps the structure of an input image, guided by a prompt (5 credits).',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new image that keeps the layout and shapes of an input image (photo, render, sculpture) while following an English prompt; costs 5 credits. For rough drawings use Sketch to Image; to copy only the look of an image use Style Guide. Each call is charged.',
    idempotent: false,
  },
  props: {
    image: stabilityProps.image({ displayName: 'Image', description: 'An image whose layout and shapes the result should keep.', required: true }),
    prompt: stabilityProps.prompt(true),
    control_strength: Property.Number({
      displayName: 'Control Strength',
      description: '0 to 1: how closely the result follows the input image. Stability AI uses 0.7 when empty.',
      required: false,
    }),
    negative_prompt: stabilityProps.negativePrompt(),
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
      path: '/v2beta/stable-image/control/structure',
      fields: {
        image,
        prompt,
        control_strength: stabilityInput.readNumber({ value: props.control_strength, label: 'Control Strength', min: 0, max: 1 }),
        negative_prompt: stabilityInput.readText(props.negative_prompt),
        style_preset: stabilityInput.styleChoice(props.style_preset),
        seed: stabilityInput.readSeed(props.seed),
        output_format: stabilityInput.outputFormatChoice(props.output_format),
      },
      files: context.files,
      fileNamePrefix: 'structure-image',
      outputFileName: stabilityInput.readText(props.output_file_name),
    });
  },
});
