import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const leaveRoom = createAction({
  auth: matrixAuth,
  name: 'leave_room',
  classification: 'WRITE',
  displayName: 'Leave Room',
  description: 'Leave a room (or reject an invite), optionally forgetting it.',
  audience: 'ai',
  aiMetadata: {
    description: 'Leaves a room, or rejects a pending invite, by roomId (!...). With forget true the room is also removed from this account\'s room list and history. Rejoining a private room afterwards needs a new invite. Leaving again succeeds.',
    idempotent: true,
  },
  outputSchema: matrixOutputSchemas.leftRoom,
  props: {
    roomId: Property.ShortText({ displayName: 'Room ID', required: true }),
    forget: Property.Checkbox({ displayName: 'Forget Room', required: false, defaultValue: false }),
    reason: Property.ShortText({ displayName: 'Reason', required: false }),
  },
  async run({ auth, propsValue }) {
    const roomId = matrixIds.roomId(propsValue.roomId);
    const reason = matrixClient.optionalText(propsValue.reason);
    await matrixClient.request({
      auth: auth.props,
      method: HttpMethod.POST,
      path: matrixIds.clientPath('rooms', roomId, 'leave'),
      body: reason === undefined ? {} : { reason },
    });
    const forget = propsValue.forget === true;
    if (forget) {
      await matrixClient.request({ auth: auth.props, method: HttpMethod.POST, path: matrixIds.clientPath('rooms', roomId, 'forget'), body: {} });
    }
    return { roomId, left: true, forgotten: forget };
  },
});
