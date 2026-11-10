import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const listChatMessagesAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_list_chat_messages',
  classification: 'SEARCH',
  displayName: 'List Channel Chat Messages',
  description: 'Lists messages in a chat channel, newest first, one page at a time.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists messages in a chat channel, newest first, with sender ID, HTML content, attachments and time. Use to read recent chat; pass nextCursor as Starting After for older messages while hasMore is true. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    channelId: heartbeatProps.id({ displayName: 'Channel ID', description: 'A chat channel. Use List Channels to find the ID.', required: true }),
    limit: heartbeatProps.limit({ max: 100, defaultValue: 50 }),
    startingAfter: heartbeatProps.startingAfter(),
  },
  outputSchema: heartbeatOutputSchemas.chatMessageList,
  async run({ auth, propsValue }) {
    const pageLimit = heartbeatApi.limit({ value: propsValue.limit, max: 100, defaultValue: 50 });
    const response = await heartbeatApi.request<unknown>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: `/chatChannel/${heartbeatApi.uuid({ value: propsValue.channelId, label: 'Channel ID' })}/messages`,
      operation: 'list chat messages',
      query: {
        limit: pageLimit,
        startingAfter: heartbeatApi.optionalUuid({ value: propsValue.startingAfter, label: 'Starting After' }),
      },
    });
    const messages = heartbeatApi.recordList(heartbeatApi.isRecord(response) ? response['data'] : undefined);
    const hasMore = heartbeatApi.isRecord(response) && response['hasMore'] === true;
    const lastId = messages[messages.length - 1]?.['id'];
    return { messages, nextCursor: hasMore && typeof lastId === 'string' ? lastId : null, hasMore };
  },
});
