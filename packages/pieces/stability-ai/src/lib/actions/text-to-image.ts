import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { stabilityAiAuth } from '../..';

export const textToImage = createAction({
  auth: stabilityAiAuth,
  name: 'text-to-image',
  displayName: 'Text to Image',
  description: 'Generate an image using a text prompt',
  props: {
    prompt: Property.ShortText({
      displayName: 'Prompt',
      required: true,
      description: 'The text to transform in image.',
    }),
    cfg_scale: Property.Number({
      displayName: 'cfg_scale',
      description:
        'How strictly the diffusion process adheres to the prompt text (higher values keep your image closer to your prompt) (MIN:0; MAX:35)',
      required: false,
      defaultValue: 7,
    }),
    height: Property.Number({
      displayName: 'height',
      description:
        'Height of the image in pixels. Must be in increments of 64 and >= 128',
      defaultValue: 512,
      required: false,
    }),
    width: Property.Number({
      displayName: 'width',
      description:
        'Width of the image in pixels. Must be in increments of 64 and >= 128',
      defaultValue: 512,
      required: false,
    }),
    samples: Property.ShortText({
      displayName: 'samples',
      description: 'Number of images to generate (MAX:10)',
      required: false,
    }),
    steps: Property.Number({
      displayName: 'steps',
      description: 'Number of diffusion steps to run (MIN:10; MAX:150)',
      required: false,
    }),
    weight: Property.Number({
      displayName: 'weight',
      defaultValue: 1,
      required: false,
    }),
    clip_guidance_preset: Property.StaticDropdown({
      displayName: 'clip_guidance_preset',
      required: false,
      options: {
        options: [
          {
            label: 'NONE',
            value: 'NONE',
          },
          {
            label: 'FAST_BLUE',
            value: 'FAST_BLUE',
          },
          {
            label: 'FAST_GREEN',
            value: 'FAST_GREEN',
          },
          {
            label: 'SIMPLE',
            value: 'SIMPLE',
          },
          {
            label: 'SLOW',
            value: 'SLOW',
          },
          {
            label: 'SLOWER',
            value: 'SLOWER',
          },
          {
            label: 'SLOWEST',
            value: 'SLOWEST',
          },
        ],
      },
    }),
    style_preset: Property.StaticDropdown({
      displayName: 'style_preset',
      required: false,
      description:
        'Pass in a style preset to guide the image model towards a particular style.',
      options: {
        options: [
          {
            label: 'enhance',
            value: 'enhance',
          },
          {
            label: 'anime',
            value: 'anime',
          },
          {
            label: 'photographic',
            value: 'photographic',
          },
          {
            label: 'digital-art',
            value: 'digital-art',
          },
          {
            label: 'comic-book',
            value: 'comic-book',
          },
          {
            label: 'fantasy-art',
            value: 'fantasy-art',
          },
          {
            label: 'line-art',
            value: 'line-art',
          },
          {
            label: 'analog-film',
            value: 'analog-film',
          },
          {
            label: 'neon-punk',
            value: 'neon-punk',
          },
          {
            label: 'isometric',
            value: 'isometric',
          },
          {
            label: 'low-poly',
            value: 'low-poly',
          },
          {
            label: 'origami',
            value: 'origami',
          },
          {
            label: 'modeling-compound',
            value: 'modeling-compound',
          },
          {
            label: 'cinematic',
            value: 'cinematic',
          },
          {
            label: '3d-model',
            value: '3d-model',
          },
          {
            label: 'pixel-art',
            value: 'pixel-art',
          },
          {
            label: 'tile-texture',
            value: 'tile-texture',
          },
        ],
      },
    }),
    engine_id: Property.StaticDropdown({
      displayName: 'Engine ID',
      required: true,
      options: {
        options: [
          {
            label: 'stable-diffusion-xl-1024-v1-0',
            value: 'stable-diffusion-xl-1024-v1-0',
          },
          {
            label: 'stable-diffusion-768-v2-1',
            value: 'stable-diffusion-768-v2-1',
          },
          {
            label: 'stable-diffusion-512-v2-1',
            value: 'stable-diffusion-512-v2-1',
          },
          {
            label: 'stable-diffusion-768-v2-0',
            value: 'stable-diffusion-768-v2-0',
          },
          {
            label: 'stable-diffusion-512-v2-0',
            value: 'stable-diffusion-512-v2-0',
          },
          {
            label: 'stable-diffusion-v1-5',
            value: 'stable-diffusion-v1-5',
          },
          {
            label: 'stable-diffusion-v1',
            value: 'stable-diffusion-v1',
          },
        ],
      },
    }),
    accept_format: Property.StaticDropdown({
      displayName: 'accept_format',
      description:
        'json will return the image as base64, and png will return the image as binary',
      required: true,
      options: {
        options: [
          {
            label: 'application/json',
            value: 'application/json',
          },
          {
            label: 'image/png',
            value: 'image/png',
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
      accept_format,
      style_preset,
      engine_id,
      weight,
    } = context.propsValue;

    const engineId = engine_id || 'stable-diffusion-v1-5';
    const apiHost = 'https://api.stability.ai';

    const apiKey = context.auth.api_key;

    const requestBody = {
      text_prompts: [
        {
          text: prompt,
          weight: Number(weight) || 1,
        },
      ],
      cfg_scale: Number(cfg_scale) || 7,
      clip_guidance_preset: clip_guidance_preset || 'NONE',
      height: Number(height) || 512,
      width: Number(width) || 512,
      samples: Number(samples) || 1,
      steps: Number(steps) || 50,
      style_preset,
    };

    const request: HttpRequest<Record<string, unknown>> = {
      method: HttpMethod.POST,
      url: `${apiHost}/v1/generation/${engineId}/text-to-image`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: accept_format,
      },
      body: requestBody,
    };

    const { body } = await httpClient.sendRequest(request);

    return body;
  },
});
