import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { fileToUploadInput, regionOf, sharedProps, webhookOf } from '../common/props';
import { runAndStoreResult } from '../common/runner';
import { iloveSchemas } from '../common/schemas';

export const compressImageAction = createAction({
  auth: iloveapiAuth,
  name: 'compress_image',
  classification: 'READ',
  displayName: 'Compress Image',
  description: 'Reduce the file size of a JPG, PNG, SVG or GIF image.',
  audience: 'both',
  outputSchema: iloveSchemas.toolResult,
  aiMetadata: {
    description:
      'Shrink an image file (JPG, PNG, SVG, GIF) with iLoveIMG and store the smaller copy as a new file. Spends iLoveAPI credits on every run and returns a new file each time.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'Image',
      required: true,
    }),
    compression_level: Property.StaticDropdown({
      displayName: 'Compression Level',
      required: false,
      defaultValue: 'recommended',
      options: {
        disabled: false,
        options: [
          { label: 'Extreme (smallest, lower quality)', value: 'extreme' },
          { label: 'Recommended (balanced)', value: 'recommended' },
          { label: 'Low (largest, best quality)', value: 'low' },
        ],
      },
    }),
    ...sharedProps,
  },
  async run(context) {
    const { file, output_filename, packaged_filename } = context.propsValue;
    const options = { compression_level: context.propsValue.compression_level ?? 'recommended' };
    return await runAndStoreResult({
      auth: context.auth.secret_text,
      region: regionOf(context.propsValue.region),
      webhook: webhookOf(context.propsValue.webhook_url),
      files: context.files,
      tool: 'compressimage',
      uploads: [fileToUploadInput({ file: file, label: 'Image' })],
      options,
      output_filename,
      packaged_filename,
    });
  },
});
