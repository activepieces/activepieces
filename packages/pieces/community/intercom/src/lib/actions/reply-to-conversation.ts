import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../..';
import { commonProps, intercomClient } from '../common';
import { ReplyToConversationMessageType } from 'intercom-client';

export const replyToConversation = createAction({
  auth: intercomAuth,
  name: 'replyToConversation',
  displayName: 'Reply to conversation',
  description: 'Reply (as an admin) to a conversation with a contact',
  props: {
    from: commonProps.admins({ displayName: 'From (Admin)', required: true }),
    conversationId: Property.ShortText({
      displayName: 'Conversation',
      required: true,
    }),
    body: Property.ShortText({
      displayName: 'Message Body',
      required: true,
    }),
  },
  async run(context) {
    return await intercomClient(context.auth).conversations.replyByIdAsAdmin({
      id: context.propsValue.conversationId,
      messageType: ReplyToConversationMessageType.COMMENT,
      adminId: context.propsValue.from,
      body: context.propsValue.body,
    });
  },
});
