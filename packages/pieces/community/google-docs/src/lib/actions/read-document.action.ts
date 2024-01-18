import { googleDocsAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

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
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const docs = google.docs({ version: 'v1', auth: authClient });
    const response = await docs.documents.get({
      documentId: context.propsValue.documentId,
    });

    if (response.status !== 200) {
      console.error(response);
      throw new Error('Error reading document');
    }

    return response.data;
  },
});
