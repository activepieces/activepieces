import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsDeleteKbDocumentOutputSchema } from '../../output-schemas';

export const moveKbDocument = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_move_kb_document',
  outputSchema: elevenlabsDeleteKbDocumentOutputSchema,
  displayName: 'Move KB Document',
  description: 'Move a document into a folder',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Moves a knowledge base document or folder into another folder. Leave the destination empty to move it to the root. Re-applying the same move is safe.',
    idempotent: true,
  },
  props: {
    documentId: Property.ShortText({ displayName: 'Document ID', description: 'The document id from List KB Documents', required: true }),
    moveTo: Property.ShortText({ displayName: 'Move To', description: 'Destination folder id, empty for the root', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/convai/knowledge-base/${encodeURIComponent(propsValue.documentId)}/move`,
      body: elevenlabsClient.compact({ values: { move_to: propsValue.moveTo } }),
    });
    return response ?? { success: true };
  },
});
