import { createAction, Property } from '@activepieces/pieces-framework';
import { stabilityAiAuth } from '../auth';
import { stabilityClient } from '../common/client';
import { stabilityInput, stabilityProps } from '../common/props';
import { imageOutputSchema } from '../common/output-schemas';

function resolveModel(model: string): { path: string; sd3Model: string | undefined } {
  if (model === 'ultra' || model === 'core') {
    return { path: `/v2beta/stable-image/generate/${model}`, sd3Model: undefined };
  }
  return { path: '/v2beta/stable-image/generate/sd3', sd3Model: model };
}

const MODELS = ['ultra', 'core', 'sd3.5-large', 'sd3.5-large-turbo', 'sd3.5-medium'];

export const generateImage = createAction({
  auth: stabilityAiAuth,
  name: 'generate_image',
  classification: 'READ',
  displayName: 'Generate Image',
  description:
    'Create an image from a text prompt with Stable Image Ultra (8 credits), Core (3 credits) or Stable Diffusion 3.5 (3.5 to 6.5 credits).',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates one image from an English text prompt with a current Stability AI model and saves it as a file. Pick Ultra for the highest quality (8 credits), Core for fast and cheap results (3 credits), or an SD 3.5 model (Large 6.5, Large Turbo 4, Medium 3.5 credits). To change an existing image use Image to Image. A CONTENT_FILTERED finish reason means the image was blurred by moderation and still charged. Each call is charged and returns a new image.',
    idempotent: false,
  },
  props: {
    model: Property.StaticDropdown<string, true>({
      displayName: 'Model',
      description: 'Ultra: 8 credits. Core: 3 credits. SD 3.5 Large: 6.5, Large Turbo: 4, Medium: 3.5 credits.',
      required: true,
      defaultValue: 'core',
      options: {
        disabled: false,
        options: [
          { label: 'Stable Image Ultra', value: 'ultra' },
          { label: 'Stable Image Core', value: 'core' },
          { label: 'Stable Diffusion 3.5 Large', value: 'sd3.5-large' },
          { label: 'Stable Diffusion 3.5 Large Turbo', value: 'sd3.5-large-turbo' },
          { label: 'Stable Diffusion 3.5 Medium', value: 'sd3.5-medium' },
        ],
      },
    }),
    prompt: stabilityProps.prompt(true),
    negative_prompt: stabilityProps.negativePrompt(),
    aspect_ratio: stabilityProps.aspectRatio(),
    style_preset: stabilityProps.stylePreset(),
    cfg_scale: Property.Number({
      displayName: 'CFG Scale',
      description: 'SD 3.5 models only (1 to 10): how strictly the image follows the prompt. Leave empty for Ultra and Core.',
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
    const prompt = stabilityInput.requireText({ value: props.prompt, label: 'Prompt' });
    const cfgScale = stabilityInput.readNumber({ value: props.cfg_scale, label: 'CFG Scale', min: 1, max: 10 });
    const { path, sd3Model } = resolveModel(model);
    if (cfgScale !== undefined && sd3Model === undefined) {
      throw new Error('CFG Scale is only supported by the SD 3.5 models. Clear it or pick an SD 3.5 model.');
    }
    return stabilityClient.generateImageFile({
      apiKey: context.auth.props.api_key,
      path,
      fields: {
        prompt,
        ...(sd3Model === undefined ? {} : { model: sd3Model, mode: 'text-to-image' }),
        negative_prompt: stabilityInput.readText(props.negative_prompt),
        aspect_ratio: stabilityInput.aspectRatioChoice(props.aspect_ratio),
        style_preset: stabilityInput.styleChoice(props.style_preset),
        cfg_scale: cfgScale,
        seed: stabilityInput.readSeed(props.seed),
        output_format: stabilityInput.outputFormatChoice(props.output_format),
      },
      files: context.files,
      fileNamePrefix: 'generated-image',
      outputFileName: stabilityInput.readText(props.output_file_name),
    });
  },
});
