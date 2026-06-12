import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';
import type { ConversationChannelType } from '../common/types';

export const listConversations = createAction({
  auth: famulorAuth,
  name: 'listConversations',
  displayName: 'List Conversations',
  description: 'List conversations with optional filters.',
  audience: 'both',
  aiMetadata: {
    description:
      'List conversations, optionally filtered by channel type, assistant, customer phone, WhatsApp sender phone, or external identifier, with cursor-based pagination. Use to find a conversation or its UUID; to read one thread\'s messages use Get Conversation. Read-only and idempotent.',
    idempotent: true,
  },
  props: famulorCommon.listConversationsProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.listConversationsSchema);

    const type = propsValue.type as ConversationChannelType | undefined;
    const customerPhone = propsValue.customer_phone as string | undefined;
    const whatsappSender = propsValue.whatsapp_sender_phone as string | undefined;
    const externalId = propsValue.external_identifier as string | undefined;
    const cursor = propsValue.cursor as string | undefined;

    return await famulorCommon.listConversations({
      auth: auth.secret_text,
      type,
      assistant_id: propsValue.assistant_id as number | undefined,
      customer_phone: customerPhone?.trim() ? customerPhone.trim() : undefined,
      whatsapp_sender_phone: whatsappSender?.trim() ? whatsappSender.trim() : undefined,
      external_identifier: externalId?.trim() ? externalId.trim() : undefined,
      per_page: propsValue.per_page as number | undefined,
      cursor: cursor?.trim() ? cursor.trim() : undefined,
    });
  },
});
