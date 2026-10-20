import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
import { matrixCommon } from '../../common/common';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const listMessages = createAction({
  auth: matrixAuth,
  name: 'list_messages',
  classification: 'SEARCH',
  displayName: 'List Messages',
  description: 'List recent events in a room, newest first.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the timeline of a room, newest first, up to limit (1-100, default 20). room accepts a room ID or alias. By default only m.room.message events are returned; set messagesOnly false to include reactions, state and other events. When hasMore is true pass nextToken back as from for the next older page. Encrypted rooms return encrypted true events without body. Read-only.',
    idempotent: true,
  },
  outputSchema: matrixOutputSchemas.listMessages,
  props: {
    room: Property.ShortText({ displayName: 'Room', description: 'Room ID (!...) or alias (#...).', required: true }),
    limit: Property.Number({ displayName: 'Limit', description: '1-100, default 20.', required: false }),
    from: Property.ShortText({ displayName: 'From', description: 'nextToken of the previous page.', required: false }),
    messagesOnly: Property.Checkbox({ displayName: 'Messages Only', required: false, defaultValue: true }),
  },
  async run({ auth, propsValue }) {
    const limit = matrixClient.parseLimit({ value: propsValue.limit, label: 'Limit', min: 1, max: 100, fallback: 20 });
    const from = matrixClient.optionalText(propsValue.from);
    const messagesOnly = propsValue.messagesOnly !== false;
    const roomId = await matrixCommon.resolveRoom({ auth: auth.props, room: propsValue.room });
    const body = await matrixClient.request({
      auth: auth.props,
      method: HttpMethod.GET,
      path: matrixIds.clientPath('rooms', roomId, 'messages'),
      query: {
        dir: 'b',
        limit,
        from,
        filter: messagesOnly ? JSON.stringify({ types: ['m.room.message', 'm.room.encrypted'] }) : undefined,
      },
    });
    const record = matrixClient.isRecord(body) ? body : {};
    const items = matrixClient.arrayOf(record['chunk']).map((event) => matrixCommon.mapEvent({ raw: event, roomId }));
    const end = matrixClient.stringOr(record['end']);
    return { items, count: items.length, hasMore: end !== null, nextToken: end };
  },
});
