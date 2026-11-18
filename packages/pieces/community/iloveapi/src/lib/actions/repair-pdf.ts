import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iloveSchemas } from '../common/schemas';
import { fileToUploadInput, regionOf, sharedProps, webhookOf } from '../common/props';
import { runAndStoreResult } from '../common/runner';

export const repairPdfAction = createAction({
  auth: iloveapiAuth,
  name: 'repair_pdf',
  classification: 'READ',
  displayName: 'Repair PDF',
  description: 'Attempt to fix a damaged or corrupted PDF file.',
  audience: 'both',
  outputSchema: iloveSchemas.toolResult,
  aiMetadata: {
    description:
      'Attempt to recover a damaged or corrupted PDF into a readable file. Best-effort: success depends on the extent of corruption and is not guaranteed. Each run produces a new output file.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'PDF File',
      required: true,
    }),
    ...sharedProps,
  },
  async run(context) {
    const { file, output_filename, packaged_filename } = context.propsValue;

    return await runAndStoreResult({
      auth: context.auth.secret_text,
      region: regionOf(context.propsValue.region),
      webhook: webhookOf(context.propsValue.webhook_url),
      files: context.files,
      tool: 'repair',
      uploads: [fileToUploadInput({ file: file })],
      output_filename,
      packaged_filename,
    });
  },
});
