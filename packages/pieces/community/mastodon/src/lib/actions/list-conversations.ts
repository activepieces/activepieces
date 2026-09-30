import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { conversationPageOutputSchema } from '../output-schemas';

export const listConversations = createAction({
  auth: mastodonAuth,
  name: 'list_conversations',
  classification: 'SEARCH',
  displayName: 'List Conversations',
  description: 'List your direct-message conversations.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one page of the connected account\'s direct-message conversations (participants, last status, unread flag), with cursors for further pages. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: conversationPageOutputSchema,
  props: {
    limit: mastodonProps.limit({ noun: 'conversations', defaultLimit: 20, maxLimit: 40 }),
    max_id: mastodonProps.maxId(),
    since_id: mastodonProps.sinceId(),
    min_id: mastodonProps.minId(),
  },
  async run(context) {
    const { limit, max_id, since_id, min_id } = context.propsValue;
    const { items, ...cursors } = await mastodonClient.requestPage<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/api/v1/conversations',
      operation: 'List Conversations',
      scope: 'read:statuses',
      query: { limit, max_id, since_id, min_id },
    });
    return { conversations: items, ...cursors };
  },
});
