import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iloveSchemas } from '../common/schemas';
import { fileToUploadInput, regionOf, sharedProps, webhookOf } from '../common/props';
import { runAndStoreResult } from '../common/runner';

export const unlockPdfAction = createAction({
  auth: iloveapiAuth,
  name: 'unlock_pdf',
  classification: 'READ',
  displayName: 'Unlock PDF',
  description: 'Remove the password from a PDF (you must know the current password).',
  audience: 'both',
  outputSchema: iloveSchemas.toolResult,
  aiMetadata: {
    description:
      'Strip password protection from a PDF, producing an unencrypted copy. You must supply the current password that protects the file. Use the Protect PDF action for the reverse operation of adding a password. Each run produces a new output file.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'PDF File',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Current Password',
      description: 'The current password protecting the PDF.',
      required: true,
    }),
    ...sharedProps,
  },
  async run(context) {
    const { file, password, output_filename, packaged_filename } =
      context.propsValue;

    if (!password) {
      throw new Error('Current password is required.');
    }

    return await runAndStoreResult({
      auth: context.auth.secret_text,
      region: regionOf(context.propsValue.region),
      webhook: webhookOf(context.propsValue.webhook_url),
      files: context.files,
      tool: 'unlock',
      uploads: [fileToUploadInput({ file: file, label: 'PDF File' })],
      perFileOverrides: [{ password }],
      output_filename,
      packaged_filename,
    });
  },
});
