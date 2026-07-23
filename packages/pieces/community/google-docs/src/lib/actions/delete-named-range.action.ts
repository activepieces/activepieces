import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const deleteNamedRange = createAction({
  auth: googleDocsAuth,
  name: 'delete_named_range',
  displayName: 'Delete Named Range',
  description: 'Delete a named range from a Google Docs document by ID or name',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes a named range from a Google Docs document. Provide either namedRangeId (targets one specific range — obtain from Read Document gdocs_get_document, cannot be guessed) or name (deletes all named ranges with that name). Re-deleting an already-gone range or name is a no-op, so this call is idempotent.',
    idempotent: true,
  },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to edit.',
      required: true,
    }),
    namedRangeId: Property.ShortText({
      displayName: 'Named Range ID',
      description: 'The ID of the named range to delete. Obtain from Read Document (gdocs_get_document) — cannot be guessed. Provide this OR Name, not both.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the named range(s) to delete. All ranges with this name will be removed. Provide this OR Named Range ID, not both.',
      required: false,
    }),
  },
  async run(context) {
    const { documentId, namedRangeId, name } = context.propsValue;

    if (!namedRangeId && !name) {
      throw new Error('Provide either Named Range ID or Name — at least one is required.');
    }

    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    const request: docs_v1.Schema$Request = namedRangeId
      ? { deleteNamedRange: { namedRangeId } }
      : { deleteNamedRange: { name } };

    try {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: [request] },
      });
      return {
        success: true,
        documentId,
        deletedNamedRangeId: namedRangeId ?? null,
        deletedName: name ?? null,
      };
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'delete the named range from'));
    }
  },
});
