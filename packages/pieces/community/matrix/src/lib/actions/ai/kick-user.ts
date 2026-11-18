import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const kickUser = createAction({
  auth: matrixAuth,
  name: 'kick_user',
  classification: 'WRITE',
  displayName: 'Kick User',
  description: 'Remove a user from a room.',
  audience: 'ai',
  aiMetadata: {
    description: 'Removes a user (@user:server) from a room (roomId !...), or revokes their pending invite. They can rejoin if the room allows it (use ban_user to stop that). Needs kick power level. Errors if the user is neither joined nor invited (e.g. on a repeat call).',
    idempotent: false,
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
    await matrixClient.request({ auth: auth.props, method: HttpMethod.POST, path: matrixIds.clientPath('rooms', roomId, 'kick'), body: requestBody });
    return { roomId, userId, membership: 'leave' };
  },
});
