import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { runwareAuth } from '../auth';
import { runwareClient } from '../common/client';
import { runwareProps } from '../common/props';
import { runwareUtils } from '../common/utils';

export const generateImagesFromText = createAction({
  auth: runwareAuth,
  name: 'generateImagesFromText',
  classification: 'READ',
  displayName: 'Generate Images from Text',
  description: 'Produce images from a text description.',
  audience: 'human',
  aiMetadata: { description: 'Generates one or more brand-new images from a text prompt using Runware (text-to-image). Choose this for pure text-to-image generation when no source image is supplied; requires a positive prompt, a model AIR identifier, and width/height. Not idempotent: each call runs a fresh generation, and unless a fixed seed is provided the output varies between runs.', idempotent: false },
  props: {
    model: runwareProps.model({ required: true }),
    positivePrompt: runwareProps.positivePrompt({ required: true }),
    negativePrompt: runwareProps.negativePrompt({ required: false }),
    height: runwareProps.height({ required: true }),
    width: runwareProps.width({ required: true }),
    steps: runwareProps.steps({ required: false }),
    CFGScale: runwareProps.CFGScale({ required: false }),
    scheduler: runwareProps.scheduler({ required: false }),
    seed: Property.Number({
      displayName: 'Seed',
      description:
        'A seed is a value used to randomize the image generation. If you want to make images reproducible (generate the same image multiple times), you can use the same seed value.',
      required: false,
    }),
    vae: Property.ShortText({
      displayName: 'VAE',
      description:
        'VAE (Variational Autoencoder) is a type of neural network architecture used for generating images. Some models may require a specific VAE to work properly. If you want to use a specific VAE, you can provide its AIR identifier here.',
      required: false,
    }),
    clipSkip: Property.Number({
      displayName: 'Clip Skip',
      description:
        'Defines additional layer skips during prompt processing in the CLIP model. Some models already skip layers by default, this parameter adds extra skips on top of those. Different values affect how your prompt is interpreted, which can lead to variations in the generated image.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      positivePrompt: runwareUtils.promptSchema,
      negativePrompt: z.optional(runwareUtils.promptSchema),
      model: runwareUtils.modelSchema,
      height: runwareUtils.dimensionsSchema,
      width: runwareUtils.dimensionsSchema,
      steps: z.optional(runwareUtils.stepsSchema),
      CFGScale: z.optional(runwareUtils.CFGScaleSchema),
      scheduler: z.optional(runwareUtils.schedulerSchema),
      seed: z.optional(z.number().check(z.minimum(0), z.maximum(9223372036854776000))),
      vae: z.optional(z.string()),
      clipSkip: z.optional(z.number().check(z.minimum(1), z.maximum(2))),
    });
    const client = runwareClient.create({ auth });
    return await client.requestImages(propsValue);
  },
});
