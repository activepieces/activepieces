import { createAction, Property } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurApi } from '../../common/api';
import { fileDocumentUploadOutputSchema } from '../../output-schemas';

export const uploadFileDocumentAction = createAction({
  auth: parseurAuth,
  name: 'parseur_upload_file_document',
  outputSchema: fileDocumentUploadOutputSchema,
  displayName: 'Upload File Document',
  description: 'Uploads a file into a mailbox for parsing.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Uploads a file (PDF, image, Word, spreadsheet, email file) to a Parseur mailbox, which parses it and uses credits. Returns the new document ID under attachments[].DocumentID; parsing is asynchronous, so read the result later with Get Document. Every call creates another document.',
    idempotent: false,
  },
  props: {
    mailboxId: parseurAiProps.mailboxId({ required: true }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to parse.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await parseurApi.uploadDocumentFile({
      auth,
      parserId: propsValue.mailboxId,
      file: propsValue.file,
    });
  },
});
