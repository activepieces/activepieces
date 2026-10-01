import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsDeleteKbDocumentOutputSchema } from '../../output-schemas';

export const moveKbDocumentsBulk = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_move_kb_documents_bulk',
  outputSchema: elevenlabsDeleteKbDocumentOutputSchema,
  displayName: 'Move KB Documents Bulk',
  description: 'Move several documents into a folder',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Moves several knowledge base documents into one folder in a single call. Re-applying the same move is safe.',
    idempotent: true,
  },
  props: {
    documentIds: Property.Array({ displayName: 'Document Ids', description: 'Document ids from List KB Documents', required: true }),
    moveTo: Property.ShortText({ displayName: 'Move To', description: 'Destination folder id, empty for the root', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/convai/knowledge-base/bulk-move`,
      body: elevenlabsClient.compact({ values: { document_ids: propsValue.documentIds, move_to: propsValue.moveTo } }),
    });
    return response ?? { success: true };
  },
});
