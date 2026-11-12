import { createAction, FilesService, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stabilityAiAuth } from '../auth';
import { StabilityAiError, stabilityClient } from '../common/client';
import { stabilityInput } from '../common/props';
import { textToImageOutputSchema } from '../common/output-schemas';

async function requestGeneration({ apiKey, engineId, body }: RequestGenerationParams): Promise<TextToImageResponse> {
  try {
    return await stabilityClient.sendJson<TextToImageResponse>({
      apiKey,
      method: HttpMethod.POST,
      path: `/v1/generation/${encodeURIComponent(engineId)}/text-to-image`,
      body,
      timeoutMs: 150_000,
    });
  } catch (error) {
    if (error instanceof StabilityAiError && engineId !== SDXL_ENGINE_ID && error.status === 404) {
      throw new StabilityAiError({
        message: stabilityClient.appendHint({
          message: error.message,
          hint: `The engine "${engineId}" is no longer in Stability AI's documentation; choose ${SDXL_ENGINE_ID} or use the Generate Image action.`,
        }),
        status: error.status,
        responseBody: error.responseBody,
      });
    }
    throw error;
  }
}

async function writeArtifacts({ artifacts, files }: WriteArtifactsParams): Promise<TextToImageItem[]> {
  const list = Array.isArray(artifacts) ? artifacts : [];
  if (list.length === 0) {
    throw new Error('Stability AI returned no images.');
  }
  if (list.every((artifact) => artifact.finishReason === 'ERROR' || typeof artifact.base64 !== 'string' || artifact.base64.length === 0)) {
    throw new Error('Stability AI failed to generate any image (finish reason ERROR).');
  }
  const timestamp = Date.now();
  return Promise.all(
    list.map(async (artifact, index) => {
      const seed = typeof artifact.seed === 'number' ? artifact.seed : null;
      const finishReason = typeof artifact.finishReason === 'string' ? artifact.finishReason : null;
      if (typeof artifact.base64 !== 'string' || artifact.base64.length === 0) {
        return { image: null, seed, finishReason };
      }
      const image = await files.write({
        fileName: `image-${timestamp}-${index + 1}.png`,
        data: Buffer.from(artifact.base64, 'base64'),
      });
      return { image, seed, finishReason };
    }),
  );
}

const SDXL_ENGINE_ID = 'stable-diffusion-xl-1024-v1-0';

const DEFAULT_CFG_SCALE = 7;

const ENGINE_ID_PATTERN = /^[A-Za-z0-9.-]+$/;

const DEFAULT_SIZES: Record<string, number> = {
  [SDXL_ENGINE_ID]: 1024,
  'stable-diffusion-768-v2-1': 768,
  'stable-diffusion-512-v2-1': 512,
  'stable-diffusion-768-v2-0': 768,
  'stable-diffusion-512-v2-0': 512,
  'stable-diffusion-v1-5': 512,
  'stable-diffusion-v1': 512,
};

const SDXL_DIMENSIONS = new Set([
  '1024x1024',
  '1152x896',
  '896x1152',
  '1216x832',
  '832x1216',
  '1344x768',
  '768x1344',
  '1536x640',
  '640x1536',
]);

const CLIP_GUIDANCE_PRESETS = ['NONE', 'FAST_BLUE', 'FAST_GREEN', 'SIMPLE', 'SLOW', 'SLOWER', 'SLOWEST'];

const STYLE_PRESETS = [
  'enhance',
  'anime',
  'photographic',
  'digital-art',
  'comic-book',
  'fantasy-art',
  'line-art',
  'analog-film',
  'neon-punk',
  'isometric',
  'low-poly',
  'origami',
  'modeling-compound',
  'cinematic',
  '3d-model',
  'pixel-art',
  'tile-texture',
];

export const textToImage = createAction({
  auth: stabilityAiAuth,
  name: 'text-to-image',
  classification: 'READ',
  displayName: 'Text to Image',
  description:
    'Generate images from a text prompt with the legacy SDXL 1.0 engine. For newer models use Generate Image.',
  audience: 'human',
  aiMetadata: {
    description:
      'Generates one or more images from a text prompt with the legacy Stable Diffusion XL 1.0 engine (REST v1). Prefer Generate Image for Stable Image Ultra, Core or SD 3.5. Costs about 0.9 credits per image at up to 30 steps; each call generates new images and is charged again.',
    idempotent: false,
  },
  props: {
    prompt: Property.ShortText({
      displayName: 'Prompt',
      required: true,
      description: 'The text to transform in image.',
    }),
    cfg_scale: Property.Number({
      displayName: 'cfg_scale',
      description:
        'How strictly the diffusion process adheres to the prompt text (higher values keep your image closer to your prompt). 1–35; 0 or empty uses the default (7).',
      required: false,
      defaultValue: 7,
    }),
    height: Property.Number({
      displayName: 'height',
      description:
        'Height of the image in pixels. SDXL 1.0 accepts only these width x height pairs: 1024x1024, 1152x896, 896x1152, 1216x832, 832x1216, 1344x768, 768x1344, 1536x640, 640x1536. Defaults to 1024.',
      required: false,
    }),
    width: Property.Number({
      displayName: 'width',
      description: 'Width of the image in pixels. Must form an allowed SDXL 1.0 pair with the height (see height). Defaults to 1024.',
      required: false,
    }),
    samples: Property.ShortText({
      displayName: 'samples',
      description: 'Number of images to generate (MIN:1; MAX:10). Defaults to 1.',
      required: false,
    }),
    steps: Property.Number({
      displayName: 'steps',
      description:
        'Number of diffusion steps to run (MIN:10; MAX:50). Defaults to 50. Each image costs 0.9 credits up to 30 steps and 0.9 x steps / 30 credits above that.',
      required: false,
    }),
    weight: Property.Number({
      displayName: 'weight',
      description: 'Weight of the prompt. Defaults to 1.',
      defaultValue: 1,
      required: false,
    }),
    clip_guidance_preset: Property.StaticDropdown({
      displayName: 'clip_guidance_preset',
      required: false,
      options: {
        options: CLIP_GUIDANCE_PRESETS.map((value) => ({ label: value, value })),
      },
    }),
    style_preset: Property.StaticDropdown({
      displayName: 'style_preset',
      required: false,
      description: 'Pass in a style preset to guide the image model towards a particular style.',
      options: {
        options: STYLE_PRESETS.map((value) => ({ label: value, value })),
      },
    }),
    engine_id: Property.StaticDropdown({
      displayName: 'Engine ID',
      description: 'Stable Diffusion XL 1.0 is the only engine Stability AI still documents for this endpoint.',
      required: true,
      options: {
        options: [{ label: 'Stable Diffusion XL 1.0', value: SDXL_ENGINE_ID }],
      },
    }),
  },
  outputSchema: textToImageOutputSchema,
  async run(context) {
    const { prompt, cfg_scale, clip_guidance_preset, height, width, samples, steps, style_preset, engine_id, weight } =
      context.propsValue;

    const engineId = stabilityInput.requireText({ value: engine_id, label: 'Engine ID' });
    if (!ENGINE_ID_PATTERN.test(engineId)) {
      throw new Error('Engine ID may contain only letters, digits, dots and hyphens.');
    }
    const text = stabilityInput.requireText({ value: prompt, label: 'Prompt' });
    const cfgScale = stabilityInput.readNumber({ value: cfg_scale, label: 'cfg_scale', min: 0, max: 35 });
    const sampleCount = stabilityInput.readNumber({ value: samples, label: 'samples', min: 1, max: 10, integer: true });
    const stepCount = stabilityInput.readNumber({ value: steps, label: 'steps', min: 10, max: 50, integer: true });
    const promptWeight = stabilityInput.readNumber({
      value: weight,
      label: 'weight',
      min: Number.NEGATIVE_INFINITY,
      max: Number.POSITIVE_INFINITY,
    });
    const requestedHeight = stabilityInput.readNumber({ value: height, label: 'height', min: 128, max: 4096, integer: true });
    const requestedWidth = stabilityInput.readNumber({ value: width, label: 'width', min: 128, max: 4096, integer: true });
    const defaultSize = DEFAULT_SIZES[engineId] ?? 512;
    const finalHeight = requestedHeight ?? defaultSize;
    const finalWidth = requestedWidth ?? defaultSize;
    if (engineId === SDXL_ENGINE_ID && !SDXL_DIMENSIONS.has(`${finalWidth}x${finalHeight}`)) {
      throw new Error(
        `SDXL 1.0 does not support ${finalWidth}x${finalHeight}. Use one of: ${[...SDXL_DIMENSIONS].join(', ')} (width x height).`,
      );
    }

    const stylePreset = stabilityInput.readText(style_preset);
    const body = {
      text_prompts: [{ text, weight: promptWeight ?? 1 }],
      cfg_scale: cfgScale === undefined || cfgScale === 0 ? DEFAULT_CFG_SCALE : cfgScale,
      clip_guidance_preset: stabilityInput.readText(clip_guidance_preset) ?? 'NONE',
      height: finalHeight,
      width: finalWidth,
      samples: sampleCount ?? 1,
      steps: stepCount ?? 50,
      ...(stylePreset === undefined ? {} : { style_preset: stylePreset }),
    };

    const response = await requestGeneration({ apiKey: context.auth.props.api_key, engineId, body });
    return writeArtifacts({ artifacts: response.artifacts, files: context.files });
  },
});

type TextToImageArtifact = {
  base64?: string;
  seed?: number;
  finishReason?: string;
};

type TextToImageResponse = {
  artifacts?: TextToImageArtifact[];
};

type TextToImageItem = {
  image: string | null;
  seed: number | null;
  finishReason: string | null;
};

type RequestGenerationParams = {
  apiKey: string;
  engineId: string;
  body: Record<string, unknown>;
};

type WriteArtifactsParams = {
  artifacts: TextToImageArtifact[] | undefined;
  files: FilesService;
};
