import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { runwareAuth } from '../auth';
import { runwareClient } from '../common/client';
import { runwareProps } from '../common/props';
import { runwareUtils } from '../common/utils';

export const generateImagesFromExistingImage = createAction({
  auth: runwareAuth,
  name: 'generateImagesFromExistingImage',
  classification: 'READ',
  displayName: 'Generate Images from Existing Image',
  description: 'Generate new images based on a provided image (image-to-image).',
  audience: 'both',
  aiMetadata: { description: 'Generates new images conditioned on a source seed image plus a text prompt using Runware (image-to-image). Choose this over text-to-image when transforming or restyling an existing picture; requires the seed image as a URL, a model AIR identifier, a positive prompt, and width/height, with an optional strength controlling how far the result departs from the source. Not idempotent: each call runs a fresh generation that varies unless a fixed seed is set.', idempotent: false },
  props: {
    seedImage: Property.ShortText({
      displayName: 'Seed Image',
      description: 'A URL for the seed image to base the generation on.',
      required: true,
    }),
    model: runwareProps.model({ required: true }),
    positivePrompt: runwareProps.positivePrompt({ required: true }),
    height: runwareProps.height({ required: true }),
    width: runwareProps.width({ required: true }),
    negativePrompt: runwareProps.negativePrompt({ required: false }),
    strength: Property.Number({
      displayName: 'Strength',
      description:
        'A value between 0 and 1 that indicates how much to transform the seed image. A value of 0 will keep the image as is, while a value of 1 will completely transform it according to the prompt.',
      required: false,
    }),
    steps: runwareProps.steps({ required: false }),
    CFGScale: runwareProps.CFGScale({ required: false }),
    scheduler: runwareProps.scheduler({ required: false }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      seedImage: z.string().check(z.url()),
      positivePrompt: runwareUtils.promptSchema,
      negativePrompt: z.optional(runwareUtils.promptSchema),
      model: runwareUtils.modelSchema,
      strength: z.optional(z.number().check(z.minimum(0), z.maximum(1))),
      height: runwareUtils.dimensionsSchema,
      width: runwareUtils.dimensionsSchema,
      steps: z.optional(runwareUtils.stepsSchema),
      CFGScale: z.optional(runwareUtils.CFGScaleSchema),
      scheduler: z.optional(runwareUtils.schedulerSchema),
    });
    const client = runwareClient.create({ auth });
    return await client.requestImages(propsValue);
  },
});
