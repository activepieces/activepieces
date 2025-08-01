import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { missiveAuth } from '../../';

export const newCommentTrigger = createTrigger({
  auth: missiveAuth,
  name: 'new_comment',
  displayName: 'New Comment',
  description: 'Fires when a comment is added to an existing conversation',
  props: {
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'Filter comments by specific conversation ID (optional)',
      required: false,
    }),
  },
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {
    id: 'comment_123',
    body: 'This is a comment',
    conversation_id: 'conv_123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  onEnable: async (context) => {
    // Set up webhook for new comments
    context.app.createListeners({
      events: ['comment.created'],
      identifierValue: context.auth.apiToken,
    });
  },
  onDisable: async () => {
    // Clean up webhook
  },
  run: async (context) => {
    const payloadBody = context.payload.body as Record<string, unknown>;
    
    // Filter by conversation ID if specified
    if (context.propsValue.conversationId && 
        payloadBody.conversation_id !== context.propsValue.conversationId) {
      return [];
    }

    return [payloadBody];
  },
}); 