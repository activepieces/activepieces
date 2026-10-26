import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const setRoomTopic = createAction({
  auth: matrixAuth,
  name: 'set_room_topic',
  classification: 'WRITE',
  displayName: 'Set Room Topic',
  description: 'Set the topic of a room.',
  audience: 'ai',
  aiMetadata: {
    description: 'Sets the topic (description line) of a room (roomId !...). An empty topic clears it. Needs state-event power level. Setting the same topic again is harmless.',
    idempotent: true,
  },
  outputSchema: matrixOutputSchemas.stateSet,
  props: {
    roomId: Property.ShortText({ displayName: 'Room ID', required: true }),
    topic: Property.ShortText({ displayName: 'Topic', description: 'Leave empty to clear it.', required: false }),
  },
  async run({ auth, propsValue }) {
    const roomId = matrixIds.roomId(propsValue.roomId);
    const value = typeof propsValue.topic === 'string' ? propsValue.topic.trim() : '';
    const body = await matrixClient.request({
      auth: auth.props,
      method: HttpMethod.PUT,
      path: matrixIds.clientPath('rooms', roomId, 'state', 'm.room.topic', ''),
      body: { topic: value },
    });
    return { eventId: matrixClient.isRecord(body) ? matrixClient.stringOr(body['event_id']) : null, roomId };
  },
});
