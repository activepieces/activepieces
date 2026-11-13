import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const searchPublicRooms = createAction({
  auth: matrixAuth,
  name: 'search_public_rooms',
  classification: 'SEARCH',
  displayName: 'Search Public Rooms',
  description: 'Search the homeserver\'s public room directory.',
  audience: 'ai',
  aiMetadata: {
    description: 'Searches the public room directory of the connection\'s homeserver (or of server, e.g. matrix.org) by a term matched against name, topic and alias. Returns up to limit (1-100, default 20) rooms; when hasMore is true pass nextToken back as since for the next page. Leave query empty to browse. Read-only; does not join anything.',
    idempotent: true,
  },
  outputSchema: matrixOutputSchemas.publicRooms,
  props: {
    query: Property.ShortText({ displayName: 'Search Term', required: false }),
    server: Property.ShortText({ displayName: 'Server', description: 'Directory of another server, e.g. matrix.org. Empty = your homeserver.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: '1-100, default 20.', required: false }),
    since: Property.ShortText({ displayName: 'Since', description: 'nextToken of the previous page.', required: false }),
  },
  async run({ auth, propsValue }) {
    const limit = matrixClient.parseLimit({ value: propsValue.limit, label: 'Limit', min: 1, max: 100, fallback: 20 });
    const term = matrixClient.optionalText(propsValue.query);
    const server = matrixClient.optionalText(propsValue.server);
    if (server !== undefined && !matrixClient.isServerName(server)) {
      throw new Error('Server must be a server name like matrix.org.');
    }
    const requestBody: Record<string, unknown> = { limit };
    const since = matrixClient.optionalText(propsValue.since);
    if (since !== undefined) requestBody['since'] = since;
    if (term !== undefined) requestBody['filter'] = { generic_search_term: term };
    const body = await matrixClient.request({
      auth: auth.props,
      method: HttpMethod.POST,
      path: matrixIds.clientPath('publicRooms'),
      query: { server },
      body: requestBody,
    });
    const record = matrixClient.isRecord(body) ? body : {};
    const items = matrixClient.arrayOf(record['chunk']).map(mapPublicRoom);
    const next = matrixClient.stringOr(record['next_batch']);
    const total = record['total_room_count_estimate'];
    return { items, count: items.length, totalEstimate: typeof total === 'number' ? total : null, hasMore: next !== null, nextToken: next };
  },
});

function mapPublicRoom(raw: unknown) {
  const room = matrixClient.isRecord(raw) ? raw : {};
  const members = room['num_joined_members'];
  return {
    roomId: matrixClient.stringOr(room['room_id']),
    name: matrixClient.stringOr(room['name']),
    topic: matrixClient.stringOr(room['topic']),
    canonicalAlias: matrixClient.stringOr(room['canonical_alias']),
    numJoinedMembers: typeof members === 'number' ? members : null,
    worldReadable: room['world_readable'] === true,
    guestCanJoin: room['guest_can_join'] === true,
    joinRule: matrixClient.stringOr(room['join_rule']),
    roomType: matrixClient.stringOr(room['room_type']),
    avatarUrl: matrixClient.stringOr(room['avatar_url']),
  };
}
