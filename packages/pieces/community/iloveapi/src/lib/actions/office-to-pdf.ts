import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { fileToUploadInput, sharedProps } from '../common/props';
import { runAndStoreResult } from '../common/runner';

export const officeToPdfAction = createAction({
  auth: iloveapiAuth,
  name: 'office_to_pdf',
  displayName: 'Office to PDF',
  description:
    'Convert Office documents (DOCX, XLSX, PPTX, ODT, etc.) to PDF.',
  audience: 'both',
  aiMetadata: {
    description:
      'Convert a single Office document (DOCX, XLSX, PPTX, ODT, ODS, ODP, RTF, or TXT) into a PDF. Use this when the source is an Office/text file; for images use JPG to PDF and for web pages use HTML to PDF. Each run produces a new converted file.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'Office File',
      description: 'Supported formats include DOCX, XLSX, PPTX, ODT, ODS, ODP, RTF, TXT.',
      required: true,
    }),
    ...sharedProps,
  },
  async run(context) {
    const { file, output_filename, packaged_filename } = context.propsValue;

    return await runAndStoreResult({
      auth: context.auth.secret_text,
      files: context.files,
      tool: 'officepdf',
      uploads: [fileToUploadInput(file)],
      output_filename,
      packaged_filename,
    });
  },
});
