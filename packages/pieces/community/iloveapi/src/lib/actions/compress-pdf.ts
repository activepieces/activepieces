import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { fileToUploadInput, sharedProps } from '../common/props';
import { runAndStoreResult } from '../common/runner';

export const compressPdfAction = createAction({
  auth: iloveapiAuth,
  name: 'compress_pdf',
  displayName: 'Compress PDF',
  description: 'Reduce the size of a PDF file using iLoveAPI.',
  props: {
    file: Property.File({
      displayName: 'PDF File',
      description: 'PDF file to compress.',
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
    const { file, compression_level, output_filename, packaged_filename } =
      context.propsValue;

    return await runAndStoreResult({
      auth: context.auth.secret_text,
      files: context.files,
      tool: 'compress',
      uploads: [fileToUploadInput(file)],
      options: {
        compression_level: compression_level ?? 'recommended',
      },
      output_filename,
      packaged_filename,
    });
  },
});
