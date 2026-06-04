import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { fileToUploadInput, sharedProps } from '../common/props';
import { runAndStoreResult } from '../common/runner';

export const pdfToJpgAction = createAction({
  auth: iloveapiAuth,
  name: 'pdf_to_jpg',
  displayName: 'PDF to JPG',
  description:
    'Convert PDF pages to JPG images, or extract images embedded in the PDF.',
  props: {
    file: Property.File({
      displayName: 'PDF File',
      required: true,
    }),
    pdfjpg_mode: Property.StaticDropdown({
      displayName: 'Mode',
      required: false,
      defaultValue: 'pages',
      options: {
        disabled: false,
        options: [
          { label: 'Render each page as a JPG', value: 'pages' },
          { label: 'Extract embedded images', value: 'extract' },
        ],
      },
    }),
    ...sharedProps,
  },
  async run(context) {
    const { file, pdfjpg_mode, output_filename, packaged_filename } =
      context.propsValue;

    return await runAndStoreResult({
      auth:context.auth.secret_text,
      files: context.files,
      tool: 'pdfjpg',
      uploads: [fileToUploadInput(file)],
      options: {
        pdfjpg_mode: pdfjpg_mode ?? 'pages',
      },
      output_filename,
      packaged_filename,
    });
  },
});
