import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const getUserProfile = createAction({
  auth: matrixAuth,
  name: 'get_user_profile',
  classification: 'READ',
  displayName: 'Get User Profile',
  description: 'Get the display name and avatar of a user.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns the global display name and avatar mxc URI of a user ID (@user:server), on any server. Fails with not found when the user does not exist or hides their profile. Read-only.',
    idempotent: true,
  },
  outputSchema: matrixOutputSchemas.profile,
  props: {
    userId: Property.ShortText({ displayName: 'User ID', description: 'e.g. @alice:example.org', required: true }),
  },
  async run({ auth, propsValue }) {
    const userId = matrixIds.userId(propsValue.userId);
    const body = await matrixClient.request({ auth: auth.props, method: HttpMethod.GET, path: matrixIds.clientPath('profile', userId) });
    const record = matrixClient.isRecord(body) ? body : {};
    return { userId, displayName: matrixClient.stringOr(record['displayname']), avatarUrl: matrixClient.stringOr(record['avatar_url']) };
  },
});
