import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { QueueItem } from '../common/types';

export const listQueueAction = createAction({
  auth: simplyprintAuth,
  name: 'list_queue',
  displayName: 'List Queue Items',
  description: 'List items in the print queue, optionally filtered to a single queue group.',
  props: {
    groupId: Property.Number({
      displayName: 'Queue group ID (optional)',
      description: 'Numeric queue group ID to filter by. Leave empty for the whole queue.',
      required: false,
    }),
    includeDone: Property.Checkbox({
      displayName: 'Include completed items',
      required: false,
      defaultValue: false,
    }),
    page: Property.Number({
      displayName: 'Page (optional)',
      description: 'Page number (1-based). Only applies to the active-queue path; ignored when "Include completed items" is on.',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page size (optional)',
      description: 'Items per page (max 100). Defaults to 100.',
      required: false,
    }),
  },
  async run(context) {
    // queue/GetItems has two response paths:
    //   - legacy GET path → {queue, groups, done_items, ...}
    //   - filter path (any POST filter triggers it) → {queue, total, page, page_amount, ...}
    // We force the filter path so the shape is consistent and `gid` (group
    // filter, POST-only on the backend) is honoured.
    //
    // The legacy `done_items` toggle isn't supported in the filter path
    // (filter path ANDs in qi.approvalStatus != DENIED and pulls only from
    // the active queue table), so when the user asks for completed items
    // we fall through to the legacy GET path and concat the two arrays.
    if (context.propsValue.includeDone) {
      const res = await simplyprintClient.simplyprintCall<{ queue?: QueueItem[]; done_items?: QueueItem[] }>({
        auth: context.auth,
        method: HttpMethod.GET,
        path: 'queue/GetItems',
        queryParams: { done_items: '1' },
      });
      return [
        ...((res.queue ?? []) as QueueItem[]),
        ...((res.done_items ?? []) as QueueItem[]),
      ];
    }

    const body: Record<string, unknown> = {
      compact: true,
      page: Math.max(1, Math.floor(context.propsValue.page ?? 1)),
      page_size: Math.min(100, context.propsValue.pageSize ?? 100),
    };
    if (typeof context.propsValue.groupId === 'number' && context.propsValue.groupId > 0) {
      body['gid'] = context.propsValue.groupId;
    }

    const res = await simplyprintClient.simplyprintCall<{ queue: QueueItem[] }>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'queue/GetItems',
      body,
    });
    return (res.queue ?? []) as QueueItem[];
  },
});
