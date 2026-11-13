import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsCreateSecretOutputSchema } from '../../output-schemas';

export const createSecret = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_create_secret',
  outputSchema: elevenlabsCreateSecretOutputSchema,
  displayName: 'Create Secret',
  description: 'Create a workspace secret',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Stores a secret value for use by agent tools and returns its secret_id. The value cannot be read back. Not idempotent: each call creates another secret.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Secret name', required: true }),
    value: Property.ShortText({ displayName: 'Value', description: 'Secret value', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/convai/secrets`,
      body: elevenlabsClient.compact({ values: { name: propsValue.name, value: propsValue.value, type: 'new' } }),
    });
    return response ?? { success: true };
  },
});
