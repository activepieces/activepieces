import { createAction, Property } from '@activepieces/pieces-framework';
import { stabilityAiAuth } from '../auth';
import { stabilityClient } from '../common/client';
import { stabilityInput, stabilityProps } from '../common/props';
import { imageOutputSchema } from '../common/output-schemas';

export const styleGuide = createAction({
  auth: stabilityAiAuth,
  name: 'style_guide',
  classification: 'READ',
  displayName: 'Style Guide',
  description: 'Create a new image from a prompt in the style of a reference image (5 credits).',
  audience: 'both',
  aiMetadata: {
    description:
      'Generates a new image from an English prompt that copies the style (colors, texture, mood) of a reference image; costs 5 credits. To restyle an existing image while keeping its content use Style Transfer. Each call is charged.',
    idempotent: false,
  },
  props: {
    image: stabilityProps.image({ displayName: 'Style Image', description: 'The image whose style to copy.', required: true }),
    prompt: stabilityProps.prompt(true),
    negative_prompt: stabilityProps.negativePrompt(),
    aspect_ratio: stabilityProps.aspectRatio(),
    fidelity: Property.Number({
      displayName: 'Fidelity',
      description: '0 to 1: how closely the result matches the style of the image. Stability AI uses 0.5 when empty.',
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
    const image = stabilityInput.readFile({ value: props.image, label: 'Style Image', required: true });
    const prompt = stabilityInput.requireText({ value: props.prompt, label: 'Prompt' });
    return stabilityClient.generateImageFile({
      apiKey: context.auth.props.api_key,
      path: '/v2beta/stable-image/control/style',
      fields: {
        image,
        prompt,
        negative_prompt: stabilityInput.readText(props.negative_prompt),
        aspect_ratio: stabilityInput.aspectRatioChoice(props.aspect_ratio),
        fidelity: stabilityInput.readNumber({ value: props.fidelity, label: 'Fidelity', min: 0, max: 1 }),
        style_preset: stabilityInput.styleChoice(props.style_preset),
        seed: stabilityInput.readSeed(props.seed),
        output_format: stabilityInput.outputFormatChoice(props.output_format),
      },
      files: context.files,
      fileNamePrefix: 'style-guide',
      outputFileName: stabilityInput.readText(props.output_file_name),
    });
  },
});
