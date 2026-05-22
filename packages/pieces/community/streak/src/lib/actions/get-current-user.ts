import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { streakAuth } from '../../auth';
import { streakApiCall } from '../common/client';
import { StreakUser } from '../common/types';

export const getCurrentUserAction = createAction({
  auth: streakAuth,
  name: 'get_current_user',
  displayName: 'Get Current User',
  description: 'Get the Streak user associated with the connected API key.',
  props: {},
  async run(context) {
    const response = await streakApiCall<StreakUser>({
      apiKey: context.auth as unknown as string,
      method: HttpMethod.GET,
      path: '/api/v1/users/me',
    });
    const user = response.body;
    return {
      user_key: user.userKey ?? user.key,
      email: user.email ?? null,
      lowercase_email: user.lowercaseEmail ?? null,
      display_name: user.displayName ?? null,
      is_oauth_complete: user.isOauthComplete ?? null,
      creation_timestamp_epoch_ms: user.creationTimestamp ?? null,
      last_updated_timestamp_epoch_ms: user.lastUpdatedTimestamp ?? null,
      last_seen_timestamp_epoch_ms: user.lastSeenTimestamp ?? null,
    };
  },
});
