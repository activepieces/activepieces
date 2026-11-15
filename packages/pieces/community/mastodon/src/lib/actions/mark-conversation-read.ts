import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { conversationOutputSchema } from '../output-schemas';

export const markConversationRead = createAction({
  auth: mastodonAuth,
  name: 'mark_conversation_read',
  classification: 'WRITE',
  displayName: 'Mark Conversation as Read',
  description: 'Mark a direct-message conversation as read.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Marks a direct-message conversation of the connected account as read. Get the conversation ID from List Conversations. Safe to retry. Returns the updated conversation.',
    idempotent: true,
  },
  outputSchema: conversationOutputSchema,
  props: {
    conversation_id: Property.ShortText({
      displayName: 'Conversation ID',
      description:
        'ID of the direct-message conversation. Obtain it from List Conversations.',
      required: true,
    }),
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: `/api/v1/conversations/${encodeURIComponent(context.propsValue.conversation_id)}/read`,
      operation: 'Mark Conversation as Read',
      scope: 'write:conversations',
    });
  },
});
