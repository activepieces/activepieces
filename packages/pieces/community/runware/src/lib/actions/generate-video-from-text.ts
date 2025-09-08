import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { compactObject, runwareRequest } from '../../lib/client';

type RunwareVideoResponse = {
  id?: string;
  status?: 'queued' | 'running' | 'succeeded' | 'failed';
  video?: {
    url?: string;
    base64?: string;
    mime_type?: string;
    width?: number;
    height?: number;
    duration?: number;
  };
  error?: unknown;
  [k: string]: unknown;
};

export const generateVideoFromText = createAction({
  name: 'generateVideoFromText',
  displayName: 'Generate Video from Text',
  description: 'Generate video from text prompt.',
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
    model: Property.ShortText({
      displayName: 'Model',
      required: false,
      description: 'Video model identifier.',
    }),
    width: Property.Number({
      displayName: 'Width',
      required: false,
      defaultValue: 768,
    }),
    height: Property.Number({
      displayName: 'Height',
      required: false,
      defaultValue: 432,
    }),
    duration: Property.Number({
      displayName: 'Duration (seconds)',
      required: false,
      defaultValue: 4,
    }),
    fps: Property.Number({
      displayName: 'FPS',
      required: false,
      defaultValue: 24,
    }),
    seed: Property.Number({
      displayName: 'Seed',
      required: false,
    }),
    endpointOverride: Property.ShortText({
      displayName: 'Endpoint Override',
      required: false,
      description:
        'Optional. Override the default endpoint. Defaults to /v1/videos/generations.',
    }),
  },
  async run(ctx) {
    const apiKey = ctx.auth as string;

    
    const url = ctx.propsValue.endpointOverride || '/v1/videos/generations';

    const body = compactObject({
      prompt: ctx.propsValue.prompt,
      model: ctx.propsValue.model,
      width: ctx.propsValue.width,
      height: ctx.propsValue.height,
      duration: ctx.propsValue.duration,
      fps: ctx.propsValue.fps,
      seed: ctx.propsValue.seed,
    });

    const res = await runwareRequest<RunwareVideoResponse>({
      apiKey,
      method: HttpMethod.POST,
      url,
      body,
    });

    return res;
  },
});