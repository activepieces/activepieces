import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { fileToUploadInput, sharedProps } from '../common/props';
import { runAndStoreResult } from '../common/runner';

export const repairPdfAction = createAction({
  auth: iloveapiAuth,
  name: 'repair_pdf',
  displayName: 'Repair PDF',
  description: 'Attempt to fix a damaged or corrupted PDF file.',
  audience: 'both',
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
      files: context.files,
      tool: 'repair',
      uploads: [fileToUploadInput(file)],
      output_filename,
      packaged_filename,
    });
  },
});
