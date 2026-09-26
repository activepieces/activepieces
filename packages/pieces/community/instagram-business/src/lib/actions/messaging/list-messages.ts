import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { listMessagesOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const listMessages = createAction({
  auth: instagramCommon.authentication,
  outputSchema: listMessagesOutputSchema,
  name: 'list_messages',
  classification: 'READ',
  displayName: 'List Messages',
  description: 'Read the messages inside one direct message thread.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads the messages inside one Instagram direct message thread, given a conversation id from List Conversations, with sender, recipient, text and timestamp for each. Instagram returns only the most recent messages of a thread rather than its full history. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    page: instagramCommon.page,
    conversation_id: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'From List Conversations.',
      required: true,
    }),
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;

    const response = await instagramCommon.graphRequest<{
      messages?: { data?: unknown[] };
    }>({
      method: HttpMethod.GET,
      resourceUri: `/${propsValue.conversation_id}`,
      accessToken: page.accessToken,
      query: {
        fields: 'messages{id,created_time,from,to,message}',
      },
    });

    const messages = response.messages?.data ?? [];
    return { messages, count: messages.length };
  },
});
