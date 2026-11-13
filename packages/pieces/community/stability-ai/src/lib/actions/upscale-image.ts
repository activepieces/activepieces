import { createAction, Property } from '@activepieces/pieces-framework';
import { stabilityAiAuth } from '../auth';
import { StabilityFile, stabilityClient } from '../common/client';
import { stabilityInput, stabilityProps } from '../common/props';
import { imageOutputSchema } from '../common/output-schemas';

function rejectFastOnlyInputs(props: Record<string, unknown>): void {
  const filled = CONSERVATIVE_ONLY_FIELDS.filter(({ key }) => stabilityInput.readText(props[key]) !== undefined).map(
    ({ label }) => label,
  );
  if (filled.length === 1) {
    throw new Error(`${filled[0]} only applies to the Conservative mode. Clear it or switch the mode.`);
  }
  if (filled.length > 1) {
    throw new Error(`${filled.join(', ')} only apply to the Conservative mode. Clear them or switch the mode.`);
  }
}

function checkFastInputSize(image: StabilityFile): void {
  const dimensions = stabilityInput.readImageDimensions(image);
  if (dimensions === null) {
    return;
  }
  const { width, height } = dimensions;
  const pixels = width * height;
  if (width < FAST_MIN_SIDE || height < FAST_MIN_SIDE || width > FAST_MAX_SIDE || height > FAST_MAX_SIDE || pixels < FAST_MIN_PIXELS || pixels > FAST_MAX_PIXELS) {
    throw new Error(
      `Fast mode accepts images of 32 to 1536 px per side and at most 1,048,576 pixels (for example 1024x1024); this image is ${width}x${height}. Generate Image results from Core and Ultra are 1536x1536 and too large: use the Conservative mode or a smaller image.`,
    );
  }
}

const FAST_MIN_SIDE = 32;
const FAST_MAX_SIDE = 1536;
const FAST_MIN_PIXELS = 1024;
const FAST_MAX_PIXELS = 1_048_576;

const CONSERVATIVE_ONLY_FIELDS = [
  { key: 'prompt', label: 'Prompt' },
  { key: 'negative_prompt', label: 'Negative Prompt' },
  { key: 'creativity', label: 'Creativity' },
  { key: 'seed', label: 'Seed' },
];

export const upscaleImage = createAction({
  auth: stabilityAiAuth,
  name: 'upscale_image',
  classification: 'READ',
  displayName: 'Upscale Image',
  description:
    'Enlarge an image. Fast: 4x larger in about a second (2 credits), input at most 1024x1024 pixels. Conservative: up to 4 megapixels with minimal changes (40 credits, needs a prompt).',
  audience: 'both',
  aiMetadata: {
    description:
      'Enlarges an image and returns the result as a file. Fast mode (2 credits) makes it 4x larger but only accepts inputs of at most 1,048,576 pixels (e.g. 1024x1024), so 1536x1536 images from Generate Image Core or Ultra must use Conservative mode (40 credits), which outputs 4 megapixels, needs an English prompt describing the image and keeps details close to the original. Output defaults to WebP because PNG results can exceed the Activepieces file size limit (10 MB on Cloud). For low-resolution images that need heavy reimagining use Creative Upscale. Each call is charged.',
    idempotent: false,
  },
  props: {
    mode: Property.StaticDropdown<string, true>({
      displayName: 'Mode',
      description:
        'Fast: 2 credits, 4x size, input at most 1,048,576 pixels (1024x1024), so 1536x1536 Core or Ultra images are too large. Conservative: 40 credits, 4 megapixel output, requires a prompt.',
      required: true,
      defaultValue: 'fast',
      options: {
        disabled: false,
        options: [
          { label: 'Fast', value: 'fast' },
          { label: 'Conservative', value: 'conservative' },
        ],
      },
    }),
    image: stabilityProps.image({
      displayName: 'Image',
      description:
        'Fast: 32 to 1536 px per side and at most 1,048,576 pixels in total (for example 1024x1024). Conservative: at least 64 px per side and 4,096 to 9,437,184 pixels.',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Conservative mode only, required there: an English description of the image.',
      required: false,
    }),
    negative_prompt: Property.LongText({
      displayName: 'Negative Prompt',
      description: 'Conservative mode only: what you do not want in the output.',
      required: false,
    }),
    creativity: Property.Number({
      displayName: 'Creativity',
      description: 'Conservative mode only, 0.2 to 0.5: how much new detail may be added. Stability AI uses 0.35 when empty.',
      required: false,
    }),
    seed: Property.Number({
      displayName: 'Seed',
      description: 'Conservative mode only: 0 to 4294967294 for repeatable results. Leave empty or 0 for random.',
      required: false,
    }),
    output_format: stabilityProps.upscaledOutputFormat(),
    output_file_name: stabilityProps.outputFileName(),
  },
  outputSchema: imageOutputSchema,
  async run(context) {
    const props = context.propsValue;
    const mode = stabilityInput.readChoice({ value: props.mode, label: 'Mode', allowed: ['fast', 'conservative'] }) ?? 'fast';
    const image = stabilityInput.readFile({ value: props.image, label: 'Image', required: true });
    const outputFormat = stabilityInput.upscaledOutputFormatChoice(props.output_format);
    const common = {
      apiKey: context.auth.props.api_key,
      files: context.files,
      outputFileName: stabilityInput.readText(props.output_file_name),
    };
    if (mode === 'fast') {
      rejectFastOnlyInputs(props);
      if (image !== undefined) {
        checkFastInputSize(image);
      }
      return stabilityClient.generateImageFile({
        ...common,
        path: '/v2beta/stable-image/upscale/fast',
        fields: { image, output_format: outputFormat },
        fileNamePrefix: 'upscaled-fast',
      });
    }
    const prompt = stabilityInput.readText(props.prompt);
    if (prompt === undefined) {
      throw new Error('Prompt is required for the Conservative mode.');
    }
    return stabilityClient.generateImageFile({
      ...common,
      path: '/v2beta/stable-image/upscale/conservative',
      fields: {
        image,
        prompt,
        negative_prompt: stabilityInput.readText(props.negative_prompt),
        creativity: stabilityInput.readNumber({ value: props.creativity, label: 'Creativity', min: 0.2, max: 0.5 }),
        seed: stabilityInput.readSeed(props.seed),
        output_format: outputFormat,
      },
      fileNamePrefix: 'upscaled-conservative',
    });
  },
});
