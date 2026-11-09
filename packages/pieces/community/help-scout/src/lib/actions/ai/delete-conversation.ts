import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutApi } from '../../common/api';
import { helpScoutAuth } from '../../common/auth';
import { helpScoutOutputSchemas } from '../../common/output-schemas';

export const deleteConversation = createAction({
  auth: helpScoutAuth,
  name: 'delete_conversation',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Conversation',
  description: 'Permanently deletes a conversation.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one Help Scout conversation with all its threads; it cannot be restored. Prefer Update Conversation with status closed or spam unless deletion is explicitly requested. Not idempotent: a repeat call on the same ID fails with 404.',
    idempotent: false,
  },
  outputSchema: helpScoutOutputSchemas['deleteConversation'],
  props: {
    conversationId: Property.Number({
      displayName: 'Conversation ID',
      description: 'Numeric Help Scout conversation ID (the id field from Search Conversations, not the #number shown in the UI).',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await helpScoutApi.deleteConversationById({ auth, conversationId: propsValue.conversationId });
    return { conversationId: String(propsValue.conversationId), deleted: true };
  },
});
