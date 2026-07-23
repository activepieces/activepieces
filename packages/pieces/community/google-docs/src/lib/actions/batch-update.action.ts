import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const batchUpdate = createAction({
  auth: googleDocsAuth,
  name: 'batch_update',
  displayName: 'Batch Update (Advanced)',
  description: 'Send a raw Google Docs batchUpdate requests array to a document',
  audience: 'ai',
  aiMetadata: {
    description:
      'Advanced escape hatch that sends a raw array of Google Docs API batchUpdate request objects directly to documents.batchUpdate. Only for callers who know the Google Docs API and need a request kind not covered by a dedicated atomic — prefer the specific atomics (Insert Text, Create Header, Insert Table, Delete Content Range, etc.) for common operations, as they validate inputs and resolve indices for you. Each request is a Docs API Request object, e.g. {"insertText":{"text":"hi","location":{"index":1}}}; requests run in order and indices must already account for prior edits in the same call. Not idempotent in general (depends on the requests supplied).',
    idempotent: false,
  },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to update.',
      required: true,
    }),
    requests: Property.Json({
      displayName: 'Requests',
      description:
        'An array of raw Google Docs batchUpdate request objects, e.g. [{"insertText":{"text":"hi","location":{"index":1}}}]. See the Google Docs API documents.batchUpdate reference for the available request kinds.',
      required: true,
    }),
  },
  async run(context) {
    const { documentId, requests } = context.propsValue;

    if (!Array.isArray(requests)) {
      throw new Error('Requests must be an array of Google Docs batchUpdate request objects.');
    }
    const docsRequests = requests as docs_v1.Schema$Request[];

    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    try {
      const response = await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: docsRequests },
      });
      return {
        success: true,
        documentId,
        appliedRequests: docsRequests.length,
        replies: response.data.replies ?? [],
      };
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'apply a batch update to'));
    }
  },
});
