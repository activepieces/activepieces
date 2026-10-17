import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { runwareAuth } from '../auth';
import { runwareClient } from '../common/client';
import { runwareProps } from '../common/props';
import type { IVideoOutputFormat } from '../common/types';
import { runwareUtils } from '../common/utils';

export const generateVideoFromText = createAction({
  auth: runwareAuth,
  name: 'generateVideoFromText',
  classification: 'READ',
  displayName: 'Generate Video from Text',
  description: 'Generate video from text prompt.',
  audience: 'human',
  aiMetadata: { description: 'Generates one or more videos from a text prompt using Runware (text-to-video). Choose this for producing video clips rather than still images; requires a positive prompt and a model AIR identifier, with optional duration, fps, and output format (MP4, WEBM, or MOV). Not idempotent: each call runs a fresh generation and output varies between runs.', idempotent: false },
  props: {
    positivePrompt: runwareProps.positivePrompt({ required: true }),
    negativePrompt: runwareProps.negativePrompt({ required: false }),
    model: runwareProps.model({ required: true }),
    duration: Property.Number({
      displayName: 'Duration',
      description: 'The duration of the generated video in seconds.',
      required: false,
    }),
    fps: Property.Number({
      displayName: 'FPS',
      description: 'Frames per second for the generated video.',
      required: false,
    }),
    outputFormat: Property.StaticDropdown<IVideoOutputFormat, false>({
      displayName: 'Output Format',
      description: 'The format of the generated video.',
      required: false,
      options: {
        options: [
          { label: 'MP4', value: 'MP4' },
          { label: 'WEBM', value: 'WEBM' },
          { label: 'MOV', value: 'MOV' },
        ],
      },
    }),
    outputQuality: Property.Number({
      displayName: 'Output Quality',
      description:
        'Sets the compression quality of the output video. Higher values preserve more quality but increase file size, lower values reduce file size but decrease quality.',
      required: false,
    }),
    uploadEndpoint: runwareProps.uploadEndpoint({ required: false }),
    numberResults: Property.Number({
      displayName: 'Number of Results',
      description:
        'Specifies how many videos to generate for the given parameters. Each video will have the same parameters but different seeds, resulting in variations of the same concept.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      positivePrompt: runwareUtils.promptSchema,
      negativePrompt: z.optional(runwareUtils.promptSchema),
      model: runwareUtils.modelSchema,
      duration: z.optional(z.number().check(z.minimum(1), z.maximum(10))),
      fps: z.optional(z.number().check(z.minimum(15), z.maximum(60))),
      outputFormat: z.optional(z.enum(['MP4', 'WEBM', 'MOV'])),
      outputQuality: z.optional(runwareUtils.outputQualitySchema),
      uploadEndpoint: z.optional(z.string().check(z.url())),
      numberResults: z.optional(z.number().check(z.minimum(1), z.maximum(4))),
    });
    const { outputFormat, ...restProps } = propsValue;
    const client = runwareClient.create({ auth });
    return await client.videoInference({
      ...restProps,
      ...(outputFormat ? { outputFormat } : {}),
    });
  },
});
