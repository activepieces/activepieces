import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsCreateSecretOutputSchema } from '../../output-schemas';

export const updateSecret = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_update_secret',
  outputSchema: elevenlabsCreateSecretOutputSchema,
  displayName: 'Update Secret',
  description: 'Change a workspace secret',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Replaces the name and value of a secret. Both are required. Re-applying the same values is safe.',
    idempotent: true,
  },
  props: {
    secretId: Property.ShortText({ displayName: 'Secret ID', description: 'The secret_id from List Secrets', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'Secret name', required: true }),
    value: Property.ShortText({ displayName: 'Value', description: 'Secret value', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.PATCH,
      path: `/v1/convai/secrets/${encodeURIComponent(propsValue.secretId)}`,
      body: elevenlabsClient.compact({ values: { name: propsValue.name, value: propsValue.value, type: 'update' } }),
    });
    return response ?? { success: true };
  },
});
