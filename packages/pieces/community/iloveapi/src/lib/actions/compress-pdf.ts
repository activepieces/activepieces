import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iloveSchemas } from '../common/schemas';
import { fileToUploadInput, regionOf, sharedProps, webhookOf } from '../common/props';
import { runAndStoreResult } from '../common/runner';

export const compressPdfAction = createAction({
  auth: iloveapiAuth,
  name: 'compress_pdf',
  classification: 'READ',
  displayName: 'Compress PDF',
  description: 'Reduce the size of a PDF file using iLoveAPI.',
  audience: 'both',
  outputSchema: iloveSchemas.toolResult,
  aiMetadata: {
    description:
      'Shrink a PDF file size, choosing a compression level: "extreme" for the smallest file at lower quality, "recommended" for a balanced result (default), or "low" for the largest file at best quality. Each run produces a new compressed file.',
    idempotent: false,
  },
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
      region: regionOf(context.propsValue.region),
      webhook: webhookOf(context.propsValue.webhook_url),
      files: context.files,
      tool: 'compress',
      uploads: [fileToUploadInput({ file: file })],
      options: {
        compression_level: compression_level ?? 'recommended',
      },
      output_filename,
      packaged_filename,
    });
  },
});
