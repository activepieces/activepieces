import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../..';
import { commonProps, intercomClient } from '../common';
import { ReplyToConversationMessageType } from 'intercom-client';

export const addNoteToConversation = createAction({
  auth: intercomAuth,
  name: 'addNoteToConversation',
  displayName: 'Add note to conversation',
  description: 'Add a note (for other admins) to an existing conversation',
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
      messageType: ReplyToConversationMessageType.NOTE,
      adminId: context.propsValue.from,
      body: context.propsValue.body,
    });
  },
});
