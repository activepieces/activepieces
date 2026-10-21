import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const unbanUser = createAction({
  auth: matrixAuth,
  name: 'unban_user',
  classification: 'WRITE',
  displayName: 'Unban User',
  description: 'Lift a ban so the user can rejoin.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lifts the ban of a user (@user:server) in a room (roomId !...). It does not re-invite or rejoin them. Needs ban power level. Errors (M_BAD_STATE) if the user is not banned, e.g. on a repeat call.',
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
    await matrixClient.request({ auth: auth.props, method: HttpMethod.POST, path: matrixIds.clientPath('rooms', roomId, 'unban'), body: requestBody });
    return { roomId, userId, membership: 'leave' };
  },
});
