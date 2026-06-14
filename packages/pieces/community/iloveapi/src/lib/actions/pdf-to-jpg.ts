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
  audience: 'both',
  aiMetadata: {
    description:
      'Turn a PDF into JPG images. Choose the "pages" mode to render each page as a full JPG, or the "extract" mode to pull out only the raster images already embedded inside the PDF. Each run produces a new converted output, so re-running creates a fresh result rather than reusing a prior one.',
    idempotent: false,
  },
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
