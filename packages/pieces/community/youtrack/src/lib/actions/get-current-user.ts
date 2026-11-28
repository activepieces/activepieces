import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { youtrackClient } from '../common/client';
import { getCurrentUserActionOutputSchema } from '../output-schemas';

export const getCurrentUserAction = createAction({
  auth: youtrackAuth,
  name: 'get_current_user',
  classification: 'READ',
  outputSchema: getCurrentUserActionOutputSchema,
  displayName: 'Get Current User',
  description: 'Gets the YouTrack user that owns the connection token.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read the YouTrack user who owns the connection token: ID, login, full name, email and profile time zone. Use to learn "me" before assigning or logging work. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const user = youtrackClient.recordOf(await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/users/me',
      query: { fields: 'id,login,fullName,email,banned,guest,profiles(general(timezone(id)))' },
      operation: 'read the current user',
    }));
    const general = youtrackClient.recordOf(youtrackClient.recordOf(user['profiles'])['general']);
    return {
      id: user['id'] ?? null,
      login: user['login'] ?? null,
      fullName: user['fullName'] ?? null,
      email: user['email'] ?? null,
      banned: user['banned'] ?? null,
      guest: user['guest'] ?? null,
      timezone: youtrackClient.textOrNull(youtrackClient.recordOf(general['timezone'])['id']),
    };
  },
});
