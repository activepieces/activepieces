import { createAction, Property } from '@activepieces/pieces-framework';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';
import { signNowClient } from '../common/client';
import { signNowSchemas } from '../common/schemas';

export const deleteDocumentAction = createAction({
  auth: signNowAuth,
  name: 'delete_document',
  displayName: 'Delete Document',
  description: 'Permanently deletes a document from your SignNow account.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a SignNow document by ID; it cannot be restored. Confirm the ID with Get Document first. This also fires the Document Deleted trigger.',
    idempotent: false,
  },
  outputSchema: signNowSchemas.deletedDocument,
  props: {
    document_id: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to delete.',
      required: true,
    }),
  },
  async run(context) {
    const { document_id } = context.propsValue;
    await signNowClient.request({
      token: getSignNowBearerToken(context.auth),
      method: 'DELETE',
      path: `/document/${signNowClient.segment(document_id)}`,
      operation: 'delete document',
    });
    return { deleted: true, id: document_id.trim() };
  },
});
