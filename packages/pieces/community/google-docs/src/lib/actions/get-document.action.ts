import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs } from '@googleapis/docs';

export const getDocument = createAction({
  auth: googleDocsAuth,
  name: 'get_document',
  displayName: 'Get Document',
  description: 'Get the full content and structure of a Google Docs document',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches the full content and structure of a Google Docs document by its ID — the raw document JSON including body elements and their character indices. Use when an agent needs the complete structure, e.g. to locate element indices before editing. For only the readable text use Get Document Plaintext; for just the body end index use Get Document End Index. Requires the document ID; read-only and idempotent.',
    idempotent: true,
  },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to read (from the document URL or Search Documents).',
      required: true,
    }),
  },
  async run(context) {
    const { documentId } = context.propsValue;
    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });
    try {
      const response = await docs.documents.get({ documentId });
      return response.data;
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'read'));
    }
  },
});
