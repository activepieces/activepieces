import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import type { BoxEventsPage } from '../../../common/types';
import { boxUtils } from '../../../common/utils';

const STREAMS = ['all', 'changes', 'sync', 'admin_logs', 'admin_logs_streaming'];

export const listEventsAction = createAction({
  auth: boxAuth,
  name: 'box_list_events',
  displayName: 'List Events',
  description: 'Lists Box user or enterprise events.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns one chunk of events and a next_stream_position to pass as Stream Position for the next chunk. "all", "changes" and "sync" are the user\'s own events; "admin_logs" is the enterprise audit log (admins only, filter with Event Types and dates).',
    idempotent: true,
  },
  props: {
    streamType: Property.StaticDropdown({
      displayName: 'Stream Type',
      description: 'all (default), changes, sync, admin_logs or admin_logs_streaming.',
      required: false,
      options: { options: STREAMS.map((value) => ({ label: value, value })) },
    }),
    streamPosition: Property.ShortText({
      displayName: 'Stream Position',
      description: 'next_stream_position from the previous call (a string of digits), or "now" for only new events. Empty starts from the oldest kept event.',
      required: false,
    }),
    eventTypes: Property.ShortText({
      displayName: 'Event Types',
      description: 'Comma-separated event types to keep, e.g. "UPLOAD,DOWNLOAD"; admin_logs streams only.',
      required: false,
    }),
    createdAfter: Property.DateTime({ displayName: 'Created After', description: 'admin_logs only, ISO 8601.', required: false }),
    createdBefore: Property.DateTime({ displayName: 'Created Before', description: 'admin_logs only, ISO 8601.', required: false }),
    limit: boxAiProps.limit({ required: false, description: 'Max events to return (1-500). Defaults to 100.' }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.streamType !== undefined && !STREAMS.includes(propsValue.streamType)) {
      throw new Error(`Stream Type must be one of: ${STREAMS.join(', ')}.`);
    }
    const text = await boxClient.requestText({
      auth,
      method: HttpMethod.GET,
      path: '/events',
      query: {
        stream_type: propsValue.streamType,
        stream_position: propsValue.streamPosition,
        event_type: propsValue.eventTypes,
        created_after: propsValue.createdAfter,
        created_before: propsValue.createdBefore,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 500, fallback: 100 }),
      },
    });
    const page: BoxEventsPage = JSON.parse(text);
    const position = /"next_stream_position"\s*:\s*"?(\d+)"?/.exec(text);
    return { ...page, next_stream_position: position ? position[1] : page.next_stream_position };
  },
});
