import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const deleteHeader = createAction({
  auth: googleDocsAuth,
  name: 'delete_header',
  displayName: 'Delete Header',
  description: 'Delete a header from a Google Docs document',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a header section from a Google Docs document by its header ID. The header ID is a hidden identifier — obtain it from the Read Document (gdocs_get_document) response under the document\'s named styles or sections; it cannot be guessed. Destructive and not idempotent: the header content is unrecoverable once deleted.',
    idempotent: false,
  },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to edit.',
      required: true,
    }),
    headerId: Property.ShortText({
      displayName: 'Header ID',
      description: 'The ID of the header to delete. Obtain from Read Document (gdocs_get_document) — cannot be guessed.',
      required: true,
    }),
  },
  async run(context) {
    const { documentId, headerId } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    const request: docs_v1.Schema$Request = {
      deleteHeader: { headerId },
    };

    try {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: [request] },
      });
      return { success: true, documentId, deletedHeaderId: headerId };
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'delete the header from'));
    }
  },
});
