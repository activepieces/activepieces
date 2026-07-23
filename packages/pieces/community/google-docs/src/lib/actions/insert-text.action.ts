import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const insertText = createAction({
  auth: googleDocsAuth,
  name: 'insert_text',
  displayName: 'Insert Text',
  description: 'Insert text into a Google Docs document at a position or at the end',
  audience: 'ai',
  aiMetadata: {
    description:
      'Inserts text into a Google Docs document. If "index" is omitted the text is appended to the end of the document body; if "index" is provided the text is inserted at that character index — obtain a valid index from Get Document End Index first (indices cannot be guessed, must fall inside an existing paragraph, and must be below the body end index). Not idempotent: each call inserts the text again.',
    idempotent: false,
  },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to insert text into.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to insert.',
      required: true,
    }),
    index: Property.Number({
      displayName: 'Index',
      description:
        'Character index to insert at. Leave empty to append to the end of the document. Get a valid index from Get Document End Index.',
      required: false,
    }),
  },
  async run(context) {
    const { documentId, text, index } = context.propsValue;
    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    const request: docs_v1.Schema$Request =
      index === undefined || index === null
        ? { insertText: { text, endOfSegmentLocation: {} } }
        : { insertText: { text, location: { index } } };

    try {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: [request] },
      });
      return {
        success: true,
        documentId,
        insertedCharacters: text.length,
        mode: index === undefined || index === null ? 'append' : 'insert_at_index',
      };
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'insert text into'));
    }
  },
});
