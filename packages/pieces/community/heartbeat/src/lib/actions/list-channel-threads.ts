import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const listChannelThreadsAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_list_channel_threads',
  classification: 'SEARCH',
  displayName: 'List Threads',
  description: 'Lists threads in a posts channel, newest first, one page at a time.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists threads in a posts channel, newest first, with author ID, HTML content, link and comment count (full comments only when Include Comments is on). Use to read recent posts or find a thread ID; pass nextCursor as Starting After for older threads. hasMore can be true on an exactly full last page. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    channelId: heartbeatProps.id({ displayName: 'Channel ID', description: 'A posts channel. Use List Channels to find the ID.', required: true }),
    includeComments: Property.Checkbox({ displayName: 'Include Comments', description: 'Also return each thread\'s comments (larger output).', required: false, defaultValue: false }),
    limit: heartbeatProps.limit({ max: 100, defaultValue: 20 }),
    startingAfter: heartbeatProps.startingAfter(),
  },
  outputSchema: heartbeatOutputSchemas.threadList,
  async run({ auth, propsValue }) {
    const pageLimit = heartbeatApi.limit({ value: propsValue.limit, max: 100, defaultValue: 20 });
    const threads = heartbeatApi.recordList(
      await heartbeatApi.request<unknown>({
        token: auth.secret_text,
        method: HttpMethod.GET,
        path: `/channels/${heartbeatApi.uuid({ value: propsValue.channelId, label: 'Channel ID' })}/threads`,
        operation: 'list threads',
        query: {
          limit: pageLimit,
          startingAfter: heartbeatApi.optionalUuid({ value: propsValue.startingAfter, label: 'Starting After' }),
        },
      }),
    ).map((thread) => {
      const comments = heartbeatApi.recordList(thread['comments']);
      const base = Object.fromEntries(Object.entries(thread).filter(([key]) => key !== 'comments'));
      return propsValue.includeComments === true
        ? { ...base, commentCount: comments.length, comments }
        : { ...base, commentCount: comments.length };
    });
    const page = heartbeatApi.toPage({ items: threads, pageLimit });
    return { threads: page.items, nextCursor: page.nextCursor, hasMore: page.hasMore };
  },
});
