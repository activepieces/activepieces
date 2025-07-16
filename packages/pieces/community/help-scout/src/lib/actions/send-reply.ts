import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../auth';
import { helpScoutCommon } from '../common/client';
import { Thread } from '../common/types';

export const sendReply = createAction({
  auth: helpScoutAuth,
  name: 'send-reply',
  displayName: 'Send Reply',
  description: 'Sends a reply to an existing conversation',
  props: {
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'ID of the conversation to reply to',
      required: true,
    }),
    messageBody: Property.LongText({
      displayName: 'Message Body',
      description: 'Reply message content',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Reply Type',
      description: 'Type of reply',
      required: false,
      defaultValue: 'message',
      options: {
        options: [
          { label: 'Message', value: 'message' },
          { label: 'Note', value: 'note' },
        ],
      },
    }),
    draft: Property.Checkbox({
      displayName: 'Draft',
      description: 'Save as draft instead of sending',
      required: false,
      defaultValue: false,
    }),
    user: helpScoutCommon.userDropdown,
    cc: Property.Array({
      displayName: 'CC',
      description: 'CC email addresses',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC',
      description: 'BCC email addresses',
      required: false,
    }),
    attachments: Property.Array({
      displayName: 'Attachments',
      description: 'File attachments (provide file URLs or base64 encoded data)',
      required: false,
    }),
    imported: Property.Checkbox({
      displayName: 'Imported',
      description: 'Mark as imported message',
      required: false,
      defaultValue: false,
    }),
    createdAt: Property.DateTime({
      displayName: 'Created At',
      description: 'When the message was created (for imported messages)',
      required: false,
    }),
  },
  async run(context) {
    const {
      conversationId,
      messageBody,
      type,
      draft,
      user,
      cc,
      bcc,
      attachments,
      imported,
      createdAt,
    } = context.propsValue;

    // Prepare thread data
    const threadData: any = {
      type: type || 'message',
      text: messageBody,
      draft: draft || false,
      imported: imported || false,
    };

    // Add optional fields
    if (user) {
      threadData.user = parseInt(user);
    }

    if (cc && cc.length > 0) {
      threadData.cc = cc;
    }

    if (bcc && bcc.length > 0) {
      threadData.bcc = bcc;
    }

    if (attachments && attachments.length > 0) {
      threadData.attachments = attachments;
    }

    if (createdAt) {
      threadData.createdAt = createdAt;
    }

    try {
      const thread = await helpScoutCommon.makeRequest(
        context.auth,
        HttpMethod.POST,
        `/conversations/${conversationId}/threads`,
        threadData
      );

      return {
        success: true,
        thread,
      };
    } catch (error) {
      throw new Error(`Failed to send reply: ${error}`);
    }
  },
});