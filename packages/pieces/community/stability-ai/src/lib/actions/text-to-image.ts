import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { stabilityAiAuth } from '../..';

export const textToImage = createAction({
  auth: stabilityAiAuth,
  name: 'text-to-image',
  classification: 'READ',
  displayName: 'Text to Image',
  description: 'Generate images from a text prompt.',
  audience: 'both',
  aiMetadata: {
    description:
      'Generates one or more images from a text prompt using a Stable Diffusion engine (selectable via the required Engine ID, e.g. SDXL or older v1/v2 models). Use to create original imagery from a description; optionally steer output with a style preset, dimensions, sampling steps, and prompt-adherence (cfg_scale). Not idempotent: each call invokes the generative model and returns fresh images, so repeating the same input yields different results.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'prompt',
      display: 'section',
      label: 'Image',
      icon: 'text',
      props: ['prompt', 'engine_id', 'style_preset'],
    },
    {
      key: 'output',
      display: 'section',
      label: 'Output',
      icon: 'sliders',
      props: ['size_info', 'width', 'height', 'samples'],
    },
  ],
  props: {
    prompt: Property.ShortText({
      displayName: 'Prompt',
      required: true,
      description: 'Describe the image you want.',
      placeholder: 'A lighthouse on a cliff at sunset, oil painting',
    }),
    engine_id: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      description: 'The Stable Diffusion model that draws the image.',
      options: {
        options: [
          {
            label: 'SDXL 1.0',
            value: 'stable-diffusion-xl-1024-v1-0',
            description: 'stable-diffusion-xl-1024-v1-0',
          },
          {
            label: 'Stable Diffusion 2.1 (768 px)',
            value: 'stable-diffusion-768-v2-1',
            description: 'stable-diffusion-768-v2-1',
          },
          {
            label: 'Stable Diffusion 2.1 (512 px)',
            value: 'stable-diffusion-512-v2-1',
            description: 'stable-diffusion-512-v2-1',
          },
          {
            label: 'Stable Diffusion 2.0 (768 px)',
            value: 'stable-diffusion-768-v2-0',
            description: 'stable-diffusion-768-v2-0',
          },
          {
            label: 'Stable Diffusion 2.0 (512 px)',
            value: 'stable-diffusion-512-v2-0',
            description: 'stable-diffusion-512-v2-0',
          },
          {
            label: 'Stable Diffusion 1.5',
            value: 'stable-diffusion-v1-5',
            description: 'stable-diffusion-v1-5',
          },
          {
            label: 'Stable Diffusion 1.4',
            value: 'stable-diffusion-v1',
            description: 'stable-diffusion-v1',
          },
        ],
      },
    }),
    style_preset: Property.StaticDropdown({
      displayName: 'Style',
      required: false,
      description: 'Steers the image toward a look. Empty: no style.',
      options: {
        options: [
          {
            label: 'Enhance',
            value: 'enhance',
          },
          {
            label: 'Anime',
            value: 'anime',
          },
          {
            label: 'Photographic',
            value: 'photographic',
          },
          {
            label: 'Digital Art',
            value: 'digital-art',
          },
          {
            label: 'Comic Book',
            value: 'comic-book',
          },
          {
            label: 'Fantasy Art',
            value: 'fantasy-art',
          },
          {
            label: 'Line Art',
            value: 'line-art',
          },
          {
            label: 'Analog Film',
            value: 'analog-film',
          },
          {
            label: 'Neon Punk',
            value: 'neon-punk',
          },
          {
            label: 'Isometric',
            value: 'isometric',
          },
          {
            label: 'Low Poly',
            value: 'low-poly',
          },
          {
            label: 'Origami',
            value: 'origami',
          },
          {
            label: 'Modeling Compound',
            value: 'modeling-compound',
          },
          {
            label: 'Cinematic',
            value: 'cinematic',
          },
          {
            label: '3D Model',
            value: '3d-model',
          },
          {
            label: 'Pixel Art',
            value: 'pixel-art',
          },
          {
            label: 'Tile Texture',
            value: 'tile-texture',
          },
        ],
      },
    }),
    size_info: Property.MarkDown({
      value:
        "Empty sizes use the model's native size: 1024 px for SDXL, 768 or 512 px for the others.",
      variant: MarkdownVariant.INFO,
    }),
    width: Property.Number({
      displayName: 'Width',
      description: 'Pixels, a multiple of 64, at least 128.',
      required: false,
      width: 'half',
    }),
    height: Property.Number({
      displayName: 'Height',
      description: 'Pixels, a multiple of 64, at least 128.',
      required: false,
      width: 'half',
    }),
    samples: Property.ShortText({
      displayName: 'Number of Images',
      description: 'How many images to make, up to 10. Empty: 1.',
      placeholder: '1',
      required: false,
    }),
    cfg_scale: Property.Number({
      displayName: 'Prompt Strength',
      description:
        'CFG scale, 0 to 35. Higher sticks closer to the prompt.',
      required: false,
      defaultValue: 7,
      advanced: true,
    }),
    steps: Property.Number({
      displayName: 'Steps',
      description:
        'Diffusion steps, 10 to 150. More steps take longer. Empty: 50.',
      required: false,
      advanced: true,
    }),
    weight: Property.Number({
      displayName: 'Prompt Weight',
      description: 'Multiplier on the prompt. Leave at 1 for normal results.',
      defaultValue: 1,
      required: false,
      advanced: true,
    }),
    clip_guidance_preset: Property.StaticDropdown({
      displayName: 'CLIP Guidance',
      description: 'Slower presets follow the prompt more closely. Empty: None.',
      required: false,
      advanced: true,
      options: {
        options: [
          {
            label: 'None',
            value: 'NONE',
          },
          {
            label: 'Fast Blue',
            value: 'FAST_BLUE',
          },
          {
            label: 'Fast Green',
            value: 'FAST_GREEN',
          },
          {
            label: 'Simple',
            value: 'SIMPLE',
          },
          {
            label: 'Slow',
            value: 'SLOW',
          },
          {
            label: 'Slower',
            value: 'SLOWER',
          },
          {
            label: 'Slowest',
            value: 'SLOWEST',
          },
        ],
      },
    }),
  },
  async run(context) {
    const {
      prompt,
      cfg_scale,
      clip_guidance_preset,
      height,
      width,
      samples,
      steps,
      style_preset,
      engine_id,
      weight,
    } = context.propsValue;

    const engineId = engine_id || 'stable-diffusion-v1-5';
    const apiHost = 'https://api.stability.ai';

    const apiKey = context.auth.props.api_key;

    const requestBody = {
      text_prompts: [
        {
          text: prompt,
          weight: Number(weight) || 1,
        },
      ],
      cfg_scale: Number(cfg_scale) || 7,
      clip_guidance_preset: clip_guidance_preset || 'NONE',
      height: Number(height) || getDefaultSize(engine_id),
      width: Number(width) || getDefaultSize(engine_id),
      samples: Number(samples) || 1,
      steps: Number(steps) || 50,
      style_preset,
    };

    const request: HttpRequest<Record<string, unknown>> = {
      method: HttpMethod.POST,
      url: `${apiHost}/v1/generation/${engineId}/text-to-image`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      body: requestBody,
    };

    const { body } = await httpClient.sendRequest<{
      artifacts: { base64: string }[];
    }>(request);

    return Promise.all(
      body.artifacts.map((artifact) =>
        context.files
          .write({
            fileName: `image-${Date.now()}.png`,
            data: Buffer.from(artifact.base64, 'base64'),
          })
          .then((file) => ({ image: file }))
      )
    );
  },
});

function getDefaultSize(engineId: string) {
  switch (engineId) {
    case 'stable-diffusion-xl-1024-v1-0':
      return 1024;
    case 'stable-diffusion-768-v2-1':
      return 768;
    case 'stable-diffusion-512-v2-1':
      return 512;
    case 'stable-diffusion-768-v2-0':
      return 768;
    case 'stable-diffusion-512-v2-0':
      return 512;
    case 'stable-diffusion-v1-5':
      return 512;
    case 'stable-diffusion-v1':
      return 512;
    default:
      return 512;
  }
}
