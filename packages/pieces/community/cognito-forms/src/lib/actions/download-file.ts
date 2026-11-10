import { createAction, Property } from '@activepieces/pieces-framework';
import { cognitoFormsAuth } from '../auth';
import { encodeSegment } from '../common/client';
import { requireText } from '../common/entries';
import { fetchCognitoFile } from '../common/files';
import { fileOutputSchema } from '../output-schemas';

export const downloadFileAction = createAction({
  auth: cognitoFormsAuth,
  name: 'download_file',
  classification: 'READ',
  displayName: 'Download File',
  description: 'Downloads a file uploaded to an entry (from a File Upload or Signature field).',
  audience: 'both',
  aiMetadata: {
    description: 'Downloads one file stored in Cognito Forms by its file ID: the "Id" of an item in an entry\'s File Upload field, the "Id" of a Signature field\'s PngFile or SvgFile (from Get Entry), or the file_id returned by Get Entry Document and returns it as a file. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: fileOutputSchema,
  props: {
    file_id: Property.ShortText({
      displayName: 'File ID',
      description: 'The "Id" of an uploaded file or a signature\'s PngFile from an entry.',
      required: true,
    }),
  },
  async run(context) {
    const fileId = requireText({ value: context.propsValue.file_id, label: 'File ID' });
    return fetchCognitoFile({
      apiKey: context.auth.secret_text,
      path: `/files/${encodeSegment(fileId)}`,
      files: context.files,
      fallbackName: `cognito-file-${fileId}`,
    });
  },
});
