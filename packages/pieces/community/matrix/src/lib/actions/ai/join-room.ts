import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const joinRoom = createAction({
  auth: matrixAuth,
  name: 'join_room',
  classification: 'WRITE',
  displayName: 'Join Room',
  description: 'Join a room by ID or alias, or accept an invite.',
  audience: 'ai',
  aiMetadata: {
    description: 'Joins a room (or accepts a pending invite) by room ID (!...) or alias (#room:server) and returns the roomId. Rooms on other servers may need via (server names that are in the room). Joining a room the account is already in succeeds and changes nothing. Fails for invite-only rooms without an invite.',
    idempotent: true,
  },
  outputSchema: matrixOutputSchemas.joinedRoom,
  props: {
    room: Property.ShortText({ displayName: 'Room', description: 'Room ID (!...) or alias (#...).', required: true }),
    via: Property.Array({ displayName: 'Via Servers', description: 'Optional server names, e.g. matrix.org', required: false }),
  },
  async run({ auth, propsValue }) {
    const room = matrixIds.roomIdOrAlias(propsValue.room);
    const via = matrixClient.stringList(propsValue.via);
    if (via.some((server) => !matrixClient.isServerName(server))) {
      throw new Error('Via servers must be server names like matrix.org.');
    }
    const query = via.length > 0 ? `?${via.map((server) => `via=${encodeURIComponent(server)}`).join('&')}` : '';
    const body = await matrixClient.request({
      auth: auth.props,
      method: HttpMethod.POST,
      path: `${matrixIds.clientPath('join', room)}${query}`,
      body: {},
    });
    const roomId = matrixClient.isRecord(body) ? matrixClient.stringOr(body['room_id']) : null;
    if (roomId === null) throw new Error('The homeserver did not return a room ID.');
    return { roomId };
  },
});
