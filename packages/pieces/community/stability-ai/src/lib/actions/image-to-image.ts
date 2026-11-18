import { createAction, Property } from '@activepieces/pieces-framework';
import { stabilityAiAuth } from '../auth';
import { stabilityClient } from '../common/client';
import { stabilityInput, stabilityProps } from '../common/props';
import { imageOutputSchema } from '../common/output-schemas';

const MODELS = ['ultra', 'sd3.5-large', 'sd3.5-large-turbo', 'sd3.5-medium'];

export const imageToImage = createAction({
  auth: stabilityAiAuth,
  name: 'image_to_image',
  classification: 'READ',
  displayName: 'Image to Image',
  description:
    'Create a new image from a starting image and a prompt with Stable Image Ultra (8 credits) or Stable Diffusion 3.5 (3.5 to 6.5 credits).',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new image that starts from an input image and follows an English prompt; Strength sets how far it may drift from the original (0 keeps it, 1 ignores it). Use Generate Image when there is no starting image, and the Edit actions (Inpaint, Search and Replace) for targeted changes. Costs 8 credits on Ultra, 3.5 to 6.5 on SD 3.5. A CONTENT_FILTERED finish reason means the image was blurred and still charged. Each call is charged.',
    idempotent: false,
  },
  props: {
    model: Property.StaticDropdown<string, true>({
      displayName: 'Model',
      description: 'Ultra: 8 credits. SD 3.5 Large: 6.5, Large Turbo: 4, Medium: 3.5 credits.',
      required: true,
      defaultValue: 'sd3.5-large',
      options: {
        disabled: false,
        options: [
          { label: 'Stable Image Ultra', value: 'ultra' },
          { label: 'Stable Diffusion 3.5 Large', value: 'sd3.5-large' },
          { label: 'Stable Diffusion 3.5 Large Turbo', value: 'sd3.5-large-turbo' },
          { label: 'Stable Diffusion 3.5 Medium', value: 'sd3.5-medium' },
        ],
      },
    }),
    image: stabilityProps.image({ displayName: 'Image', description: 'The starting image (JPEG, PNG or WebP).', required: true }),
    prompt: stabilityProps.prompt(true),
    strength: Property.Number({
      displayName: 'Strength',
      description: 'From 0 to 1. 0 returns an image close to the input, 1 almost ignores it.',
      required: true,
    }),
    negative_prompt: stabilityProps.negativePrompt(),
    style_preset: stabilityProps.stylePreset(),
    cfg_scale: Property.Number({
      displayName: 'CFG Scale',
      description: 'SD 3.5 models only (1 to 10): how strictly the image follows the prompt. Leave empty for Ultra.',
      required: false,
    }),
    seed: stabilityProps.seed(),
    output_format: stabilityProps.outputFormat(),
    output_file_name: stabilityProps.outputFileName(),
  },
  outputSchema: imageOutputSchema,
  async run(context) {
    const props = context.propsValue;
    const model = stabilityInput.readChoice({ value: props.model, label: 'Model', allowed: MODELS });
    if (model === undefined) {
      throw new Error('Model is required.');
    }
    const image = stabilityInput.readFile({ value: props.image, label: 'Image', required: true });
    const prompt = stabilityInput.requireText({ value: props.prompt, label: 'Prompt' });
    const strength = stabilityInput.readNumber({ value: props.strength, label: 'Strength', min: 0, max: 1 });
    if (strength === undefined) {
      throw new Error('Strength is required.');
    }
    const cfgScale = stabilityInput.readNumber({ value: props.cfg_scale, label: 'CFG Scale', min: 1, max: 10 });
    const isUltra = model === 'ultra';
    if (cfgScale !== undefined && isUltra) {
      throw new Error('CFG Scale is only supported by the SD 3.5 models. Clear it or pick an SD 3.5 model.');
    }
    return stabilityClient.generateImageFile({
      apiKey: context.auth.props.api_key,
      path: isUltra ? '/v2beta/stable-image/generate/ultra' : '/v2beta/stable-image/generate/sd3',
      fields: {
        prompt,
        ...(isUltra ? {} : { model, mode: 'image-to-image' }),
        image,
        strength,
        negative_prompt: stabilityInput.readText(props.negative_prompt),
        style_preset: stabilityInput.styleChoice(props.style_preset),
        cfg_scale: cfgScale,
        seed: stabilityInput.readSeed(props.seed),
        output_format: stabilityInput.outputFormatChoice(props.output_format),
      },
      files: context.files,
      fileNamePrefix: 'image-to-image',
      outputFileName: stabilityInput.readText(props.output_file_name),
    });
  },
});
