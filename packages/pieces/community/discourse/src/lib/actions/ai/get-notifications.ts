import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseSchemas } from '../../common/schemas';

export const getNotificationsAction = createAction({
  auth: discourseAuth,
  name: 'get_notifications',
  classification: 'READ',
  displayName: 'Get Notifications',
  description: 'Returns the notifications of the connection API user.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get the notifications (mentions, replies, likes, messages) of the connection API Username, newest first, with Offset paging. Does not mark them read. Read-only.',
    idempotent: true,
  },
  props: {
    offset: Property.Number({ displayName: 'Offset', required: false }),
  },
  outputSchema: discourseSchemas.notifications,
  async run({ auth, propsValue }) {
    const offset = discourseInput.boundedNumber({ value: propsValue.offset, label: 'Offset', min: 0, max: 1000000, fallback: 0 });
    const body = discourseMap.rec(
      await discourseRequest({ auth: auth.props, method: HttpMethod.GET, path: '/notifications.json', query: { offset } }),
    );
    const items = discourseMap.list(body['notifications']).map((raw) => discourseMap.notification({ raw }));
    const total = discourseMap.num(body['total_rows_notifications']);
    const nextOffset = offset + items.length;
    const hasMore = items.length > 0 && (total === null ? typeof body['load_more_notifications'] === 'string' : nextOffset < total);
    return { items, count: items.length, total, offset, next_offset: hasMore ? nextOffset : null, has_more: hasMore };
  },
});
