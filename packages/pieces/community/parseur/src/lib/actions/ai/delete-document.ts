import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurClient } from '../../common/client';
import { deleteDocumentOutputSchema } from '../../output-schemas';

export const deleteDocumentAction = createAction({
  auth: parseurAuth,
  name: 'parseur_delete_document',
  outputSchema: deleteDocumentOutputSchema,
  displayName: 'Delete Document',
  description: 'Permanently deletes a document.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a Parseur document and its parsed data; it cannot be restored. Get the ID from List Documents.',
    idempotent: false,
  },
  props: {
    documentId: parseurAiProps.documentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await parseurClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/document/${encodeURIComponent(propsValue.documentId)}`,
    });
    return { deleted: true, documentId: propsValue.documentId };
  },
});
