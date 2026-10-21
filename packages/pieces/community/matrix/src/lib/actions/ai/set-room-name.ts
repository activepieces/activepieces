import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const setRoomName = createAction({
  auth: matrixAuth,
  name: 'set_room_name',
  classification: 'WRITE',
  displayName: 'Set Room Name',
  description: 'Rename a room.',
  audience: 'ai',
  aiMetadata: {
    description: 'Sets the display name of a room (roomId !...). An empty name clears it, so clients fall back to the alias or member names. Needs state-event power level. Setting the same name again is harmless.',
    idempotent: true,
  },
  outputSchema: matrixOutputSchemas.stateSet,
  props: {
    roomId: Property.ShortText({ displayName: 'Room ID', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'Leave empty to clear it.', required: false }),
  },
  async run({ auth, propsValue }) {
    const roomId = matrixIds.roomId(propsValue.roomId);
    const value = typeof propsValue.name === 'string' ? propsValue.name.trim() : '';
    const body = await matrixClient.request({
      auth: auth.props,
      method: HttpMethod.PUT,
      path: matrixIds.clientPath('rooms', roomId, 'state', 'm.room.name', ''),
      body: { name: value },
    });
    return { eventId: matrixClient.isRecord(body) ? matrixClient.stringOr(body['event_id']) : null, roomId };
  },
});
