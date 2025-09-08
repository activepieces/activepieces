import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { compactObject, runwareRequest } from '../../lib/client';

type RunwareImageResponse = {
  id?: string;
  status?: 'queued' | 'running' | 'succeeded' | 'failed';
  images?: Array<{
    url?: string;
    base64?: string;
    mime_type?: string;
    seed?: number;
    width?: number;
    height?: number;
  }>;
  error?: unknown;
  [k: string]: unknown;
};

export const generateImagesFromImage = createAction({
  name: 'generateImagesFromImage',
  displayName: 'Generate Images from Existing Image',
  description: 'Generate new images based on a provided image (image-to-image).',
  props: {
    initImageUrl: Property.ShortText({
      displayName: 'Source Image URL or Base64',
      required: true,
      description:
        'Public image URL or data URI/base64 of the source image to guide generation.',
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: false,
      description: 'Optional text prompt to nudge the output style/content.',
    }),
    strength: Property.Number({
      displayName: 'Strength',
      required: false,
      description: 'How strongly to follow the source image vs the prompt (0-1).',
      defaultValue: 0.7,
    }),
    model: Property.ShortText({
      displayName: 'Model',
      required: false,
    }),
    steps: Property.Number({
      displayName: 'Steps',
      required: false,
      defaultValue: 28,
    }),
    guidance: Property.Number({
      displayName: 'Guidance (CFG)',
      required: false,
      defaultValue: 7,
    }),
    images: Property.Number({
      displayName: 'Number of Images',
      required: false,
      defaultValue: 1,
    }),
    seed: Property.Number({
      displayName: 'Seed',
      required: false,
    }),
    endpointOverride: Property.ShortText({
      displayName: 'Endpoint Override',
      required: false,
      description:
        'Optional. Override the default endpoint. Defaults to /v1/images/edits.',
    }),
  },
  async run(ctx) {
    const apiKey = ctx.auth as string;

    
    const url = ctx.propsValue.endpointOverride || '/v1/images/edits';

    const body = compactObject({
      init_image: ctx.propsValue.initImageUrl,
      prompt: ctx.propsValue.prompt,
      model: ctx.propsValue.model,
      strength: ctx.propsValue.strength,
      steps: ctx.propsValue.steps,
      guidance: ctx.propsValue.guidance,
      n: ctx.propsValue.images,
      seed: ctx.propsValue.seed,
    });

    const res = await runwareRequest<RunwareImageResponse>({
      apiKey,
      method: HttpMethod.POST,
      url,
      body,
    });

    return res;
  },
});