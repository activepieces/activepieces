import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ntfyAuth } from '../auth';
import { ntfyClient } from '../common/client';
import { serverHealthOutputSchema } from '../output-schemas';

export const checkServerHealth = createAction({
  auth: ntfyAuth,
  name: 'ntfy_check_server_health',
  classification: 'READ',
  displayName: 'Check Server Health',
  description: 'Check that the ntfy server on the connection is up and accepts the connection\'s token.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Calls the ntfy server\'s health endpoint with the connection\'s credentials and reports whether it is healthy. Use to confirm a self-hosted server is reachable before publishing; an invalid access token makes it fail with HTTP 401. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  outputSchema: serverHealthOutputSchema,
  async run({ auth }) {
    const response = await ntfyClient.request<{ healthy?: boolean }>({
      auth,
      method: HttpMethod.GET,
      path: '/v1/health',
    });
    return {
      healthy: response.body?.healthy === true,
      server_url: ntfyClient.baseUrl(auth),
    };
  },
});
