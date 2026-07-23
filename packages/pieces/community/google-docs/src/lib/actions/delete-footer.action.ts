import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const deleteFooter = createAction({
  auth: googleDocsAuth,
  name: 'delete_footer',
  displayName: 'Delete Footer',
  description: 'Delete a footer from a Google Docs document',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a footer section from a Google Docs document by its footer ID. The footer ID is a hidden identifier — obtain it from the Read Document (gdocs_get_document) response under the document\'s named styles or sections; it cannot be guessed. Destructive and not idempotent: the footer content is unrecoverable once deleted.',
    idempotent: false,
  },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to edit.',
      required: true,
    }),
    footerId: Property.ShortText({
      displayName: 'Footer ID',
      description: 'The ID of the footer to delete. Obtain from Read Document (gdocs_get_document) — cannot be guessed.',
      required: true,
    }),
  },
  async run(context) {
    const { documentId, footerId } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    const request: docs_v1.Schema$Request = {
      deleteFooter: { footerId },
    };

    try {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: [request] },
      });
      return { success: true, documentId, deletedFooterId: footerId };
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'delete the footer from'));
    }
  },
});
