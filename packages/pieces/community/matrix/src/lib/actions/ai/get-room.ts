import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
import { matrixCommon } from '../../common/common';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const getRoom = createAction({
  auth: matrixAuth,
  name: 'get_room',
  classification: 'READ',
  displayName: 'Get Room',
  description: 'Get a room\'s name, topic, alias, encryption and member counts. Accepts an alias.',
  audience: 'ai',
  aiMetadata: {
    description: 'Looks up a room by room ID (!...) or alias (#room:server) and returns roomId, name, topic, canonicalAlias, encrypted, joinRule, historyVisibility, roomVersion, creator, roomType (m.space for spaces) and joined/invited member counts. Use it to turn an alias into a room ID. The account must be in the room (or the room must be world-readable). Read-only.',
    idempotent: true,
  },
  outputSchema: matrixOutputSchemas.room,
  props: {
    room: Property.ShortText({ displayName: 'Room', description: 'Room ID (!...) or alias (#...).', required: true }),
  },
  async run({ auth, propsValue }) {
    const roomId = await matrixCommon.resolveRoom({ auth: auth.props, room: propsValue.room });
    const body = await matrixClient.request({ auth: auth.props, method: HttpMethod.GET, path: matrixIds.clientPath('rooms', roomId, 'state') });
    const events = matrixClient.arrayOf(body);
    const create = contentOf({ events, type: 'm.room.create' });
    const aliases = contentOf({ events, type: 'm.room.canonical_alias' });
    const memberships = events
      .filter((item) => matrixClient.isRecord(item) && item['type'] === 'm.room.member')
      .map((item) => (matrixClient.isRecord(item) && matrixClient.isRecord(item['content']) ? item['content']['membership'] : undefined));
    const createEvent = events.find((item) => matrixClient.isRecord(item) && item['type'] === 'm.room.create');
    return {
      roomId,
      name: matrixClient.stringOr(contentOf({ events, type: 'm.room.name' })['name']),
      topic: matrixClient.stringOr(contentOf({ events, type: 'm.room.topic' })['topic']),
      canonicalAlias: matrixClient.stringOr(aliases['alias']),
      altAliases: matrixClient.arrayOf(aliases['alt_aliases']).filter((alias): alias is string => typeof alias === 'string'),
      encrypted: Object.keys(contentOf({ events, type: 'm.room.encryption' })).length > 0,
      joinRule: matrixClient.stringOr(contentOf({ events, type: 'm.room.join_rules' })['join_rule']),
      historyVisibility: matrixClient.stringOr(contentOf({ events, type: 'm.room.history_visibility' })['history_visibility']),
      roomVersion: matrixClient.stringOr(create['room_version']) ?? '1',
      creator: matrixClient.stringOr(create['creator']) ?? (matrixClient.isRecord(createEvent) ? matrixClient.stringOr(createEvent['sender']) : null),
      roomType: matrixClient.stringOr(create['type']),
      joinedMemberCount: memberships.filter((m) => m === 'join').length,
      invitedMemberCount: memberships.filter((m) => m === 'invite').length,
    };
  },
});

function contentOf({ events, type }: { events: unknown[]; type: string }): Record<string, unknown> {
  const event = events.find((item) => matrixClient.isRecord(item) && item['type'] === type && item['state_key'] === '');
  return matrixClient.isRecord(event) && matrixClient.isRecord(event['content']) ? event['content'] : {};
}
