import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iloveSchemas } from '../common/schemas';
import { fileToUploadInput, regionOf, sharedProps, webhookOf } from '../common/props';
import { runAndStoreResult } from '../common/runner';

export const protectPdfAction = createAction({
  auth: iloveapiAuth,
  name: 'protect_pdf',
  classification: 'READ',
  displayName: 'Protect PDF',
  description: 'Add a password to a PDF document.',
  audience: 'both',
  outputSchema: iloveSchemas.toolResult,
  aiMetadata: {
    description:
      'Encrypt a PDF with a password so it cannot be opened without that password. Use Unlock PDF for the reverse operation of removing a known password. Each run produces a new protected file.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'PDF File',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Password used to encrypt the PDF.',
      required: true,
    }),
    ...sharedProps,
  },
  async run(context) {
    const { file, password, output_filename, packaged_filename } =
      context.propsValue;

    if (!password) {
      throw new Error('Password is required.');
    }

    return await runAndStoreResult({
      auth: context.auth.secret_text,
      region: regionOf(context.propsValue.region),
      webhook: webhookOf(context.propsValue.webhook_url),
      files: context.files,
      tool: 'protect',
      uploads: [fileToUploadInput({ file: file })],
      options: { password },
      output_filename,
      packaged_filename,
    });
  },
});
