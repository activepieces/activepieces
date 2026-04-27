import { googleDocsAuth, createGoogleClient } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { google } from 'googleapis';

export const readDocument = createAction({
  displayName: 'Read Document',
  auth: googleDocsAuth,
  name: 'read_document',
  description: 'Read a document from Google Docs',
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to read',
      required: true,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);

    const docs = google.docs({ version: 'v1', auth: authClient });
    const response = await docs.documents.get({
      documentId: context.propsValue.documentId,
    });

    if (response.status !== 200) {
      throw new Error(`Error reading document: status ${response.status}`);
    }

    return response.data;
  },
});
