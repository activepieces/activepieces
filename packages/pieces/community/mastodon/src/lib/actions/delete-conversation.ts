import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { mastodonClient } from '../common/client';
import { removedConversationOutputSchema } from '../output-schemas';

export const deleteConversation = createAction({
  auth: mastodonAuth,
  name: 'delete_conversation',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Conversation',
  description: 'Remove a direct-message conversation from your list.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes a direct-message conversation from the connected account\'s conversation list only; the statuses themselves are not deleted and other participants keep it. Repeating the call fails with not found.',
    idempotent: false,
  },
  outputSchema: removedConversationOutputSchema,
  props: {
    conversation_id: Property.ShortText({
      displayName: 'Conversation ID',
      description:
        'ID of the direct-message conversation. Obtain it from List Conversations.',
      required: true,
    }),
  },
  async run(context) {
    await mastodonClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.DELETE,
      path: `/api/v1/conversations/${encodeURIComponent(context.propsValue.conversation_id)}`,
      operation: 'Remove Conversation',
      scope: 'write:conversations',
    });
    return { success: true, conversation_id: context.propsValue.conversation_id };
  },
});
