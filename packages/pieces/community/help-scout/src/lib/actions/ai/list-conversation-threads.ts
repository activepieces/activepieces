import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutApi } from '../../common/api';
import { helpScoutAuth } from '../../common/auth';
import { helpScoutOutputSchemas } from '../../common/output-schemas';

export const listConversationThreads = createAction({
  auth: helpScoutAuth,
  name: 'list_conversation_threads',
  classification: 'READ',
  displayName: 'List Conversation Threads',
  description: 'Lists the threads (messages, replies, notes) of a conversation.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the threads of one Help Scout conversation, newest first: customer messages, agent replies, internal notes and system line items, each with type, body and author. Use to read the full history before answering. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: helpScoutOutputSchemas['listThreads'],
  props: {
    conversationId: Property.Number({
      displayName: 'Conversation ID',
      description: 'Numeric Help Scout conversation ID (the id field from Search Conversations, not the #number shown in the UI).',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of items to return (default 50, max 500). Help Scout pages are fetched until this is reached.',
      required: false,
      defaultValue: 50,
    }),
  },
  async run({ auth, propsValue }) {
    const { items, truncated } = await helpScoutApi.fetchPaged({
      auth,
      path: `/conversations/${helpScoutApi.encodeId(propsValue.conversationId)}/threads`,
      embedKey: 'threads',
      limit: propsValue.limit ?? 50,
    });
    return { threads: items, count: items.length, truncated };
  },
});
