import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../../../auth';
import { sendfoxClient } from '../../../common/client';
import { sendfoxGetCurrentUserOutputSchema } from '../../../output-schemas';

export const getCurrentUserAction = createAction({
  auth: sendfoxAuth,
  name: 'sendfox_get_current_user',
  outputSchema: sendfoxGetCurrentUserOutputSchema,
  displayName: 'Get Current User',
  description: 'Get the SendFox account the connection belongs to',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the SendFox account behind this connection: its ID, name, email, country, timezone and language. Use it to check which account is connected.',
    idempotent: true,
  },
  props: {
  },
  async run(context) {
    return await sendfoxClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/me',
    });
  },
});
