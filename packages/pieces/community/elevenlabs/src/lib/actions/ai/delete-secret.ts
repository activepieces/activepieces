import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsDeleteKbDocumentOutputSchema } from '../../output-schemas';

export const deleteSecret = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_delete_secret',
  outputSchema: elevenlabsDeleteKbDocumentOutputSchema,
  displayName: 'Delete Secret',
  description: 'Delete a workspace secret',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes a workspace secret. A second call on the same id fails.',
    idempotent: false,
  },
  props: {
    secretId: Property.ShortText({ displayName: 'Secret ID', description: 'The secret_id from List Secrets', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.DELETE,
      path: `/v1/convai/secrets/${encodeURIComponent(propsValue.secretId)}`,
    });
    return response ?? { success: true };
  },
});
