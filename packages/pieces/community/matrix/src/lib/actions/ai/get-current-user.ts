import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const getCurrentUser = createAction({
  auth: matrixAuth,
  name: 'get_current_user',
  classification: 'READ',
  displayName: 'Get Current User',
  description: 'Get the Matrix user ID and device of this connection.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns the user ID (@name:server), device ID and guest flag of the account behind this connection, plus the homeserver URL. Use it to learn who "me" is before acting on rooms. Read-only.',
    idempotent: true,
  },
  outputSchema: matrixOutputSchemas.currentUser,
  props: {},
  async run({ auth }) {
    const body = await matrixClient.request({ auth: auth.props, method: HttpMethod.GET, path: matrixIds.clientPath('account', 'whoami') });
    const record = matrixClient.isRecord(body) ? body : {};
    return {
      userId: matrixClient.stringOr(record['user_id']),
      deviceId: matrixClient.stringOr(record['device_id']),
      isGuest: record['is_guest'] === true,
      homeserver: matrixClient.normalizeHomeserver(auth.props.base_url),
    };
  },
});
