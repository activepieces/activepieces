import { createAction, Property } from '@activepieces/pieces-framework';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
import { matrixCommon } from '../../common/common';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const listJoinedRooms = createAction({
  auth: matrixAuth,
  name: 'list_joined_rooms',
  classification: 'SEARCH',
  displayName: 'List Joined Rooms',
  description: 'List the rooms this account has joined, with their names.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists rooms the account is joined to, with room ID and name (null when the room has no name, e.g. most direct chats). Returns up to limit (1-100, default 50) rooms starting at offset; total is the number of joined rooms and nextOffset the offset of the next page (null at the end). Read-only.',
    idempotent: true,
  },
  outputSchema: matrixOutputSchemas.joinedRooms,
  props: {
    limit: Property.Number({ displayName: 'Limit', description: '1-100, default 50.', required: false }),
    offset: Property.Number({ displayName: 'Offset', description: 'Default 0.', required: false }),
  },
  async run({ auth, propsValue }) {
    const limit = matrixClient.parseLimit({ value: propsValue.limit, label: 'Limit', min: 1, max: 100, fallback: 50 });
    const offset = matrixClient.parseLimit({ value: propsValue.offset, label: 'Offset', min: 0, max: Number.MAX_SAFE_INTEGER, fallback: 0 });
    const all = await matrixCommon.joinedRoomIds({ auth: auth.props });
    const page = all.slice(offset, offset + limit);
    const items = await matrixCommon.mapLimited({
      items: page,
      limit: 5,
      fn: async (roomId) => ({ roomId, name: await matrixCommon.roomName({ auth: auth.props, roomId }) }),
    });
    const next = offset + page.length;
    return { items, count: items.length, total: all.length, hasMore: next < all.length, nextOffset: next < all.length ? next : null };
  },
});
