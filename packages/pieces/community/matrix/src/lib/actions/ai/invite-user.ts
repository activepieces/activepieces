import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const inviteUser = createAction({
  auth: matrixAuth,
  name: 'invite_user',
  classification: 'WRITE',
  displayName: 'Invite User',
  description: 'Invite a user to a room.',
  audience: 'ai',
  aiMetadata: {
    description: 'Invites a user (@user:server) to a room (roomId !...) this account is in; the user must accept before joining. Needs invite power level in the room. Inviting a user whose invite is still pending succeeds and changes nothing; it errors if the user has already joined or is banned (unban first).',
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
    await matrixClient.request({ auth: auth.props, method: HttpMethod.POST, path: matrixIds.clientPath('rooms', roomId, 'invite'), body: requestBody });
    return { roomId, userId, membership: 'invite' };
  },
});
