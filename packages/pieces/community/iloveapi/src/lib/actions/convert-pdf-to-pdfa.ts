import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { CONFORMANCE_OPTIONS, fileToUploadInput, regionOf, sharedProps, webhookOf } from '../common/props';
import { runAndStoreResult } from '../common/runner';
import { iloveSchemas } from '../common/schemas';

export const convertPdfaAction = createAction({
  auth: iloveapiAuth,
  name: 'convert_pdf_to_pdfa',
  classification: 'READ',
  displayName: 'Convert PDF to PDF/A',
  description: 'Convert a PDF into an archival PDF/A document.',
  audience: 'both',
  outputSchema: iloveSchemas.toolResult,
  aiMetadata: {
    description:
      'Convert a PDF into PDF/A (ISO archival format) at the chosen conformance level and store the result as a new file. Use Validate PDF/A to check an existing file instead. Spends credits on every run.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'PDF File',
      required: true,
    }),
    conformance: Property.StaticDropdown({
      displayName: 'Conformance Level',
      required: false,
      defaultValue: 'pdfa-2b',
      options: {
        disabled: false,
        options: CONFORMANCE_OPTIONS,
      },
    }),
    allow_downgrade: Property.Checkbox({
      displayName: 'Allow Downgrade',
      description: 'Allow a lower conformance level when the file cannot reach the chosen one.',
      required: false,
      defaultValue: true,
    }),
    ...sharedProps,
  },
  async run(context) {
    const { file, output_filename, packaged_filename } = context.propsValue;
    const options = {
      conformance: context.propsValue.conformance ?? 'pdfa-2b',
      allow_downgrade: context.propsValue.allow_downgrade ?? true,
    };
    return await runAndStoreResult({
      auth: context.auth.secret_text,
      region: regionOf(context.propsValue.region),
      webhook: webhookOf(context.propsValue.webhook_url),
      files: context.files,
      tool: 'pdfa',
      uploads: [fileToUploadInput({ file: file, label: 'PDF File' })],
      options,
      output_filename,
      packaged_filename,
    });
  },
});
