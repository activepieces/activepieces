import { createAction, Property } from '@activepieces/pieces-framework';
import { linkupAuth, linkupAction, accountIdProp } from '../common';

export const getConversation = createAction({
  auth: linkupAuth,
  name: 'get_conversation',
  displayName: 'Get Conversation',
  description: 'Retrieve the message history of a LinkedIn conversation, by conversation ID or profile URL.',
  audience: 'both',
  aiMetadata: { description: 'Reads the message history of one LinkedIn thread, addressed either by conversation ID or by the other participant\'s profile URL, with count and cursor paging for longer threads. Use it to gather context before replying with Send Message. Requires the account ID plus one of the two addressing inputs. Read-only and idempotent.', idempotent: true },
  props: {
    accountId: accountIdProp,
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'Provide this OR a Profile URL',
      required: false,
    }),
    profileUrl: Property.ShortText({
      displayName: 'Profile URL',
      description: 'Profile URL of the other participant',
      required: false,
    }),
    count: Property.Number({
      displayName: 'Count',
      description: 'Number of messages to retrieve',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Pagination cursor from a previous response',
      required: false,
    }),
  },
  async run(context) {
    const { accountId, conversationId, profileUrl, count, cursor } = context.propsValue;
    return linkupAction(context.auth.secret_text, 'messages', 'get_conversation', accountId, {
      conversation_id: conversationId,
      profile_url: profileUrl,
      count,
      cursor,
    });
  },
});
