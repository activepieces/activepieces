import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const getThreadAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_get_thread',
  classification: 'READ',
  displayName: 'Get Thread',
  description: 'Gets one thread with its comments and replies.',
  audience: 'both',
  aiMetadata: {
    description: 'Returns one thread by ID with its HTML content, author ID, channel, link and all comments with their replies (two levels). Use to read a discussion before replying. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    threadId: heartbeatProps.id({ displayName: 'Thread ID', description: 'Use List Threads to find the ID.', required: true }),
  },
  outputSchema: heartbeatOutputSchemas.thread,
  async run({ auth, propsValue }) {
    return heartbeatApi.request<Record<string, unknown>>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: `/threads/${heartbeatApi.uuid({ value: propsValue.threadId, label: 'Thread ID' })}`,
      operation: 'get thread',
    });
  },
});
