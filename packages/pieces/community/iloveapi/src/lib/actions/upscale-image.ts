import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { fileToUploadInput, regionOf, sharedProps, webhookOf } from '../common/props';
import { runAndStoreResult } from '../common/runner';
import { iloveSchemas } from '../common/schemas';

export const upscaleImageAction = createAction({
  auth: iloveapiAuth,
  name: 'upscale_image',
  classification: 'READ',
  displayName: 'Upscale Image',
  description: 'Enlarge an image 2x or 4x with AI upscaling.',
  audience: 'both',
  outputSchema: iloveSchemas.toolResult,
  aiMetadata: {
    description:
      'Increase the resolution of an image by 2x or 4x with iLoveIMG upscaling and store the enlarged copy as a new file. Costs more credits than other image tools; each run creates a new file.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'Image',
      required: true,
    }),
    multiplier: Property.StaticDropdown({
      displayName: 'Scale',
      required: true,
      defaultValue: 2,
      options: {
        disabled: false,
        options: [
          { label: '2x', value: 2 },
          { label: '4x', value: 4 },
        ],
      },
    }),
    ...sharedProps,
  },
  async run(context) {
    const { file, output_filename, packaged_filename } = context.propsValue;
    const multiplier = Number(context.propsValue.multiplier ?? 2);
    if (multiplier !== 2 && multiplier !== 4) {
      throw new Error('Scale must be 2 or 4.');
    }
    const options = { multiplier };
    return await runAndStoreResult({
      auth: context.auth.secret_text,
      region: regionOf(context.propsValue.region),
      webhook: webhookOf(context.propsValue.webhook_url),
      files: context.files,
      tool: 'upscaleimage',
      uploads: [fileToUploadInput({ file: file, label: 'Image' })],
      options,
      output_filename,
      packaged_filename,
    });
  },
});
