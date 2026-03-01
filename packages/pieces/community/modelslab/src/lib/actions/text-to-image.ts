import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { modelsLabAuth } from '../..';

const FETCH_BASE = 'https://modelslab.com/api/v6/images/fetch';
const MAX_POLLS = 12;
const POLL_MS = 5000;

async function pollForResult(apiKey: string, requestId: string): Promise<string[]> {
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    const req: HttpRequest = {
      method: HttpMethod.POST,
      url: `${FETCH_BASE}/${requestId}`,
      headers: { 'Content-Type': 'application/json' },
      body: { key: apiKey },
    };
    const { body } = await httpClient.sendRequest<{
      status: string;
      output?: string[];
      messege?: string;
    }>(req);
    if (body.status === 'success' && body.output) return body.output;
    if (body.status === 'error') throw new Error(body.messege || 'Generation failed');
  }
  throw new Error('ModelsLab image generation timed out.');
}

export const textToImage = createAction({
  auth: modelsLabAuth,
  name: 'text-to-image',
  displayName: 'Text to Image',
  description: 'Generate an image from a text prompt using ModelsLab.',
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'The text prompt to generate an image from.',
    }),
    negative_prompt: Property.LongText({
      displayName: 'Negative Prompt',
      required: false,
      description: 'Things to exclude from the image.',
    }),
    model_id: Property.StaticDropdown({
      displayName: 'Model',
      required: false,
      description: 'The model to use for image generation.',
      options: {
        options: [
          { label: 'Flux (default)', value: 'flux' },
          { label: 'Stable Diffusion XL', value: 'sdxl' },
          { label: 'Stable Diffusion 2.1', value: 'stable-diffusion-2-1' },
          { label: 'Realistic Vision', value: 'realistic-vision-v5' },
          { label: 'DreamShaper', value: 'dream-shaper-8797' },
        ],
      },
    }),
    width: Property.Number({
      displayName: 'Width',
      required: false,
      description: 'Image width in pixels (256–1024, divisible by 8).',
      defaultValue: 512,
    }),
    height: Property.Number({
      displayName: 'Height',
      required: false,
      description: 'Image height in pixels (256–1024, divisible by 8).',
      defaultValue: 512,
    }),
    num_inference_steps: Property.Number({
      displayName: 'Steps',
      required: false,
      description: 'Number of inference steps (20–50).',
      defaultValue: 30,
    }),
    guidance_scale: Property.Number({
      displayName: 'Guidance Scale',
      required: false,
      description: 'How closely the image follows the prompt (1–20).',
      defaultValue: 7.5,
    }),
    samples: Property.Number({
      displayName: 'Samples',
      required: false,
      description: 'Number of images to generate (1–4).',
      defaultValue: 1,
    }),
    seed: Property.Number({
      displayName: 'Seed',
      required: false,
      description: 'Random seed for reproducibility (-1 for random).',
      defaultValue: -1,
    }),
    safety_checker: Property.Checkbox({
      displayName: 'Safety Checker',
      required: false,
      description: 'Enable safety filter.',
      defaultValue: true,
    }),
  },
  async run(context) {
    const apiKey = context.auth.props.api_key;
    const {
      prompt, negative_prompt, model_id, width, height,
      num_inference_steps, guidance_scale, samples, seed, safety_checker,
    } = context.propsValue;

    const requestBody: Record<string, unknown> = {
      key: apiKey,
      prompt,
      model_id: model_id || 'flux',
      width: width || 512,
      height: height || 512,
      num_inference_steps: num_inference_steps || 30,
      guidance_scale: guidance_scale || 7.5,
      samples: samples || 1,
      seed: seed ?? -1,
      safety_checker: safety_checker ? 'yes' : 'no',
    };

    if (negative_prompt) requestBody['negative_prompt'] = negative_prompt;

    const req: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://modelslab.com/api/v6/images/text2img',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    };

    const { body } = await httpClient.sendRequest<{
      status: string;
      output?: string[];
      id?: string;
      messege?: string;
    }>(req);

    if (body.status === 'error') throw new Error(body.messege || 'ModelsLab API error');
    if (body.status === 'processing' && body.id) {
      return { images: await pollForResult(apiKey, body.id) };
    }
    return { images: body.output || [] };
  },
});
