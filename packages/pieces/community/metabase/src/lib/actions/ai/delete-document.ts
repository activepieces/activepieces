import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseDeleteDocumentOutputSchema } from '../../output-schemas';

export const deleteDocumentAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_delete_document',
  outputSchema: metabaseDeleteDocumentOutputSchema,
  displayName: 'Delete Document',
  description: 'Permanently delete a document.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a document (it is moved to the trash first, as Metabase requires). To only move it to the trash (recoverable), use Update Document with Archived = Yes.',
    idempotent: false,
  },
  props: {
    documentId: metabaseAiProps.documentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await metabaseApi.updateDocument({
      auth,
      documentId: propsValue.documentId,
      body: { archived: true },
    });
    await metabaseApi.deleteDocument({
      auth,
      documentId: propsValue.documentId,
    });
    return { deleted: true, documentId: propsValue.documentId };
  },
});
