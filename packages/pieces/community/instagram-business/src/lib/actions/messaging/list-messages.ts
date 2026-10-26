import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { listMessagesOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const listMessages = createAction({
  auth: instagramCommon.authentication,
  outputSchema: listMessagesOutputSchema,
  name: 'list_messages',
  classification: 'SEARCH',
  displayName: 'List Messages',
  description: 'Read the messages inside one direct message thread.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads the messages inside one Instagram direct message thread, given a conversation id from List Conversations, with sender, recipient, text and timestamp for each. Instagram returns only the most recent messages of a thread rather than its full history. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    { key: 'account', display: 'section', label: 'Account', icon: 'user', props: ['page'] },
    { key: 'conversation', display: 'section', label: 'Thread', icon: 'inbox', props: ['conversation_id'] },
  ],
  props: {
    page: instagramCommon.page,
    conversation_id: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'The id from List Conversations.',
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
