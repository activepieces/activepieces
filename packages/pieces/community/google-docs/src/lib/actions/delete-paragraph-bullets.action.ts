import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const deleteParagraphBullets = createAction({
  auth: googleDocsAuth,
  name: 'delete_paragraph_bullets',
  displayName: 'Delete Paragraph Bullets',
  description: 'Remove bullet list formatting from paragraphs in a range of a Google Docs document',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes bullet or numbered list formatting from all paragraphs within the given character index range in a Google Docs document. The paragraphs\' text content is preserved; only the list nesting and bullet glyphs are removed. Obtain valid startIndex and endIndex from Get Document End Index (gdocs_get_document_end_index) — indices cannot be guessed. Idempotent: re-running on already plain paragraphs is a no-op.',
    idempotent: true,
  },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to edit.',
      required: true,
    }),
    startIndex: Property.Number({
      displayName: 'Start Index',
      description: 'Inclusive start character index of the range. Obtain from Get Document End Index (gdocs_get_document_end_index).',
      required: true,
    }),
    endIndex: Property.Number({
      displayName: 'End Index',
      description: 'Exclusive end character index of the range. Must be greater than Start Index. Obtain from Get Document End Index (gdocs_get_document_end_index).',
      required: true,
    }),
  },
  async run(context) {
    const { documentId, startIndex, endIndex } = context.propsValue;

    if (endIndex <= startIndex) {
      throw new Error('End Index must be greater than Start Index.');
    }

    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    const request: docs_v1.Schema$Request = {
      deleteParagraphBullets: {
        range: { startIndex, endIndex },
      },
    };

    try {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: [request] },
      });
      return { success: true, documentId, rangeStart: startIndex, rangeEnd: endIndex };
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'delete paragraph bullets from'));
    }
  },
});
