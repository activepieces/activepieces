import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { runwareAuth } from '../auth';
import { runwareClient } from '../common/client';
import { runwareProps } from '../common/props';
import type { IOutputFormat } from '../common/types';
import { runwareUtils } from '../common/utils';

export const imageBackgroundRemoval = createAction({
  auth: runwareAuth,
  name: 'imageBackgroundRemoval',
  classification: 'READ',
  displayName: 'Image Background Removal',
  description: 'Request image background removal.',
  audience: 'human',
  aiMetadata: { description: 'Removes the background from an input image using Runware, returning a newly generated image (optionally PNG, JPG, or WEBP). Choose this to isolate a subject or produce a transparent cutout; requires the input image as a URL and a model AIR identifier. Not idempotent: each call submits a fresh generation request rather than returning a stored result.', idempotent: false },
  props: {
    inputImage: Property.ShortText({
      displayName: 'Input Image',
      description: 'A URL for the image to have its background removed.',
      required: true,
    }),
    model: runwareProps.model({ required: true }),
    outputFormat: Property.StaticDropdown<IOutputFormat, false>({
      displayName: 'Output Format',
      description: 'The format of the output image with the background removed.',
      required: false,
      options: {
        options: [
          { label: 'PNG', value: 'PNG' },
          { label: 'JPG', value: 'JPG' },
          { label: 'WEBP', value: 'WEBP' },
        ],
      },
    }),
    outputQuality: Property.Number({
      displayName: 'Output Quality',
      description:
        'Sets the compression quality of the output image. Higher values preserve more quality but increase file size, lower values reduce file size but decrease quality.',
      required: false,
    }),
    uploadEndpoint: runwareProps.uploadEndpoint({ required: false }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      inputImage: z.string().check(z.url()),
      model: runwareUtils.modelSchema,
      outputFormat: z.optional(z.enum(['PNG', 'JPG', 'WEBP'])),
      outputQuality: z.optional(runwareUtils.outputQualitySchema),
      uploadEndpoint: z.optional(z.string().check(z.url())),
    });
    const { outputFormat, ...restProps } = propsValue;
    const client = runwareClient.create({ auth });
    return await client.removeImageBackground({
      ...restProps,
      ...(outputFormat ? { outputFormat } : {}),
    });
  },
});
