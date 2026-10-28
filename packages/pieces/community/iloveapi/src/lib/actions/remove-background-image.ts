import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { fileToUploadInput, regionOf, sharedProps, webhookOf } from '../common/props';
import { runAndStoreResult } from '../common/runner';
import { iloveSchemas } from '../common/schemas';

export const removeBackgroundImageAction = createAction({
  auth: iloveapiAuth,
  name: 'remove_background_image',
  classification: 'READ',
  displayName: 'Remove Image Background',
  description: 'Remove the background from a photo and return a PNG with transparency.',
  audience: 'both',
  outputSchema: iloveSchemas.toolResult,
  aiMetadata: {
    description:
      'Cut the subject out of a photo with iLoveIMG background removal and store the result as a new transparent PNG. Costs more credits than other image tools; each run creates a new file.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'Image',
      required: true,
    }),
    ...sharedProps,
  },
  async run(context) {
    const { file, output_filename, packaged_filename } = context.propsValue;
    const options = {};
    return await runAndStoreResult({
      auth: context.auth.secret_text,
      region: regionOf(context.propsValue.region),
      webhook: webhookOf(context.propsValue.webhook_url),
      files: context.files,
      tool: 'removebackgroundimage',
      uploads: [fileToUploadInput({ file: file, label: 'Image' })],
      options,
      output_filename,
      packaged_filename,
    });
  },
});
