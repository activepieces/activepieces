import { createAction, Property } from '@activepieces/pieces-framework';
import { parseurAuth } from '../auth';
import { parseurApi } from '../common/api';
import { parseurProps } from '../common/props';
import { fileDocumentUploadOutputSchema } from '../output-schemas';

export const createDocumentFromFileAction = createAction({
  auth: parseurAuth,
  name: 'createDocumentFromFile',
  outputSchema: fileDocumentUploadOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Document from File',
  description: 'Creates new document in mailbox from file.',
  audience: 'human',
  aiMetadata: {
    description:
      'Uploads a file (e.g. PDF, image, attachment) into a specified Parseur parser/mailbox as a new document for parsing. Use when the source is a binary file rather than email content. Requires the target parser ID and the file; each upload creates a separate document, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    parserId: parseurProps.parserId({ required: true }),
    file: Property.File({
      displayName: 'File',
      description: 'Select the file to upload',
      required: true,
    }),
  },
  async run({ auth, propsValue: { parserId, file } }) {
    if (!parserId) {
      throw new Error('Parser is required');
    }
    return await parseurApi.uploadDocumentFile({
      auth,
      parserId: String(parserId),
      file,
    });
  },
});
