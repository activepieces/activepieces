import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const banUser = createAction({
  auth: matrixAuth,
  name: 'ban_user',
  classification: 'DESTRUCTIVE',
  displayName: 'Ban User',
  description: 'Ban a user from a room.',
  audience: 'ai',
  aiMetadata: {
    description: 'Bans a user (@user:server) from a room (roomId !...): removes them if present and blocks rejoining until unban_user. Needs ban power level. Banning an already banned user succeeds and changes nothing.',
    idempotent: true,
  },
  outputSchema: matrixOutputSchemas.membership,
  props: {
    roomId: Property.ShortText({ displayName: 'Room ID', required: true }),
    userId: Property.ShortText({ displayName: 'User ID', description: 'e.g. @alice:example.org', required: true }),
    reason: Property.ShortText({ displayName: 'Reason', required: false }),
  },
  async run({ auth, propsValue }) {
    const roomId = matrixIds.roomId(propsValue.roomId);
    const userId = matrixIds.userId(propsValue.userId);
    const reason = matrixClient.optionalText(propsValue.reason);
    const requestBody: Record<string, unknown> = { user_id: userId };
    if (reason !== undefined) requestBody['reason'] = reason;
    await matrixClient.request({ auth: auth.props, method: HttpMethod.POST, path: matrixIds.clientPath('rooms', roomId, 'ban'), body: requestBody });
    return { roomId, userId, membership: 'ban' };
  },
});
