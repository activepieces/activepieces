import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetUserOutputSchema } from '../../output-schemas';

export const getUser = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_user',
  outputSchema: elevenlabsGetUserOutputSchema,
  displayName: 'Get User',
  description: 'Get the current account user',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the user behind the API key: user id, name, API key preview and subscription summary. Use to check which account a connection belongs to.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/user`,
    });
    return response ?? { success: true };
  },
});
