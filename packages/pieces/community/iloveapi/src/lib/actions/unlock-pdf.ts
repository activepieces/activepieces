import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { sharedProps } from '../common/props';
import { runAndStoreResult } from '../common/runner';

export const unlockPdfAction = createAction({
  auth: iloveapiAuth,
  name: 'unlock_pdf',
  displayName: 'Unlock PDF',
  description: 'Remove the password from a PDF (you must know the current password).',
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
      files: context.files,
      tool: 'unlock',
      uploads: [
        {
          kind: 'file',
          file: { base64: file.base64, filename: file.filename },
        },
      ],
      perFileOverrides: [{ password }],
      output_filename,
      packaged_filename,
    });
  },
});
