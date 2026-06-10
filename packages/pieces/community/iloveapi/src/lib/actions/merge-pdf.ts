import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { sharedProps } from '../common/props';
import { runAndStoreResult } from '../common/runner';
import { UploadInput } from '../common/client';

export const mergePdfAction = createAction({
  auth: iloveapiAuth,
  name: 'merge_pdf',
  displayName: 'Merge PDF',
  description:
    'Combine multiple PDF files into a single document, in the order provided.',
  props: {
    files: Property.Array({
      displayName: 'PDF Files',
      description:
        'List of PDF files to merge. The output preserves the listed order.',
      required: true,
      properties: {
        file: Property.File({
          displayName: 'File',
          required: true,
        }),
      },
    }),
    ...sharedProps,
  },
  async run(context) {
    const { files, output_filename, packaged_filename } = context.propsValue;

    if (!Array.isArray(files) || files.length < 2) {
      throw new Error('At least two PDF files are required for merging.');
    }

    const uploads: UploadInput[] = files.map((entry) => {
      const file = (entry as { file: { base64: string; filename: string } }).file;
      if (!file?.base64) {
        throw new Error('Each row must include a file.');
      }
      return {
        kind: 'file',
        file: { base64: file.base64, filename: file.filename },
      };
    });

    return await runAndStoreResult({
      auth: context.auth.secret_text,
      files: context.files,
      tool: 'merge',
      uploads,
      output_filename,
      packaged_filename,
    });
  },
});
