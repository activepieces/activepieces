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

export const generateImagesFromText = createAction({
  name: 'generateImagesFromText',
  displayName: 'Generate Images from Text',
  description: 'Produce images from a text description.',
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'Text description of the desired image.',
    }),
    negativePrompt: Property.LongText({
      displayName: 'Negative Prompt',
      required: false,
    }),
    model: Property.ShortText({
      displayName: 'Model',
      required: false,
      description: 'Model ID or alias to use (e.g., flux/dev, sdxl, etc.).',
    }),
    width: Property.Number({
      displayName: 'Width',
      required: false,
      defaultValue: 1024,
    }),
    height: Property.Number({
      displayName: 'Height',
      required: false,
      defaultValue: 1024,
    }),
    steps: Property.Number({
      displayName: 'Steps',
      required: false,
      defaultValue: 28,
    }),
    guidance: Property.Number({
      displayName: 'Guidance (CFG)',
      required: false,
      description: 'Classifier-Free Guidance scale.',
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
        'Optional. Override the default endpoint. Defaults to /v1/images/generations.',
    }),
  },
  async run(ctx) {
    const apiKey = ctx.auth as string;
    const body = compactObject({
      prompt: ctx.propsValue.prompt,
      negative_prompt: ctx.propsValue.negativePrompt,
      model: ctx.propsValue.model,
      width: ctx.propsValue.width,
      height: ctx.propsValue.height,
      steps: ctx.propsValue.steps,
      guidance: ctx.propsValue.guidance,
      n: ctx.propsValue.images,
      seed: ctx.propsValue.seed,
    });

  
    const url = ctx.propsValue.endpointOverride || '/v1/images/generations';

    const res = await runwareRequest<RunwareImageResponse>({
      apiKey,
      method: HttpMethod.POST,
      url,
      body,
    });

    return res;
  },
});