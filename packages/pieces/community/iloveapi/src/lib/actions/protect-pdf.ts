import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { fileToUploadInput, sharedProps } from '../common/props';
import { runAndStoreResult } from '../common/runner';

export const protectPdfAction = createAction({
  auth: iloveapiAuth,
  name: 'protect_pdf',
  displayName: 'Protect PDF',
  description: 'Add a password to a PDF document.',
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
      files: context.files,
      tool: 'protect',
      uploads: [fileToUploadInput(file)],
      options: { password },
      output_filename,
      packaged_filename,
    });
  },
});
