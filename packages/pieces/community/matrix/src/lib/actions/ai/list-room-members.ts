import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const listRoomMembers = createAction({
  auth: matrixAuth,
  name: 'list_room_members',
  classification: 'SEARCH',
  displayName: 'List Room Members',
  description: 'List the joined members of a room.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists every joined member of a room (roomId !...) with user ID, display name and avatar mxc URI. Invited, left and banned users are not included. The account must be in the room. Read-only.',
    idempotent: true,
  },
  outputSchema: matrixOutputSchemas.members,
  props: {
    roomId: Property.ShortText({ displayName: 'Room ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const roomId = matrixIds.roomId(propsValue.roomId);
    const body = await matrixClient.request({ auth: auth.props, method: HttpMethod.GET, path: matrixIds.clientPath('rooms', roomId, 'joined_members') });
    const joined = matrixClient.isRecord(body) && matrixClient.isRecord(body['joined']) ? body['joined'] : {};
    const items = Object.entries(joined).map(([userId, info]) => {
      const record = matrixClient.isRecord(info) ? info : {};
      return { userId, displayName: matrixClient.stringOr(record['display_name']), avatarUrl: matrixClient.stringOr(record['avatar_url']) };
    });
    return { items, count: items.length };
  },
});
