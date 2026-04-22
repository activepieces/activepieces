import { googleDocsAuth, createGoogleClient } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { flattenDoc } from '../common';
import { documentIdProp } from '../common/props';

export const readDocument = createAction({
  displayName: 'Read Document',
  auth: googleDocsAuth,
  name: 'read_document',
  description:
    'Fetch a Google Doc and return its title, plain-text content, metadata, and the raw structured document.',
  props: {
    documentId: documentIdProp('Document', 'The Google Doc to read.'),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const docs = google.docs({ version: 'v1', auth: authClient });

    try {
      const response = await docs.documents.get({
        documentId: context.propsValue.documentId,
      });
      return flattenDoc(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to read document: ${message}`);
    }
  },
});
