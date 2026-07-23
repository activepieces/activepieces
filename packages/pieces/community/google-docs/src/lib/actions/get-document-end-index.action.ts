import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs } from '@googleapis/docs';

export const getDocumentEndIndex = createAction({
  auth: googleDocsAuth,
  name: 'get_document_end_index',
  displayName: 'Get Document End Index',
  description: 'Get the end index of a Google Docs document body',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the end index of a Google Docs document body (the highest character position) so an agent can compute where to insert, delete, or style content. Call this FIRST before any index-based editing atomic (Insert Text with an explicit index, Delete Content Range, etc.) — Google Docs edits are addressed by an integer character index that cannot be guessed. Requires the document ID; read-only and idempotent.',
    idempotent: true,
  },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to inspect (from the document URL or Search Documents).',
      required: true,
    }),
  },
  async run(context) {
    const { documentId } = context.propsValue;
    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    try {
      const response = await docs.documents.get({ documentId });
      const content = response.data.body?.content ?? [];
      const lastElement = content[content.length - 1];
      const endIndex = lastElement?.endIndex ?? 1;

      return {
        documentId,
        title: response.data.title ?? null,
        endIndex,
        maxInsertIndex: Math.max(1, endIndex - 1),
      };
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'read'));
    }
  },
});
