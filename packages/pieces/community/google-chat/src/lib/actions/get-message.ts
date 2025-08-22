import { createAction, Property } from '@activepieces/pieces-framework';

import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { googleChatAuth } from '../common/auth';

export const getMessage = createAction({
  auth: googleChatAuth,
  name: 'getMessage',
  displayName: 'Get Message',
  description: 'Retrieve details of a message in Google Chat',
  props: {
    space: Property.ShortText({
      displayName: 'Space Name',
      description: 'The space resource name (e.g., spaces/SPACE_ID) where the message is located',
      required: true,
    }),
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the message to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const { space, messageId } = context.propsValue;
    
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const chat = google.chat({ version: 'v1', auth: authClient });

    // Construct the space name if needed
    let spaceName = space;
    if (!space.startsWith('spaces/')) {
      spaceName = `spaces/${space}`;
    }

    // Construct the message resource name
    const messageName = `${spaceName}/messages/${messageId}`;

    const response = await chat.spaces.messages.get({
      name: messageName,
    });

    return {
      name: response.data.name,
      text: response.data.text,
      sender: response.data.sender,
      createTime: response.data.createTime,
      lastUpdateTime: response.data.lastUpdateTime,
      space: response.data.space,
      thread: response.data.thread,
      argumentText: response.data.argumentText,
      slashCommand: response.data.slashCommand,
      attachment: response.data.attachment,
      cards: response.data.cards,
      cardsV2: response.data.cardsV2,
      annotations: response.data.annotations,
      threadReply: response.data.threadReply,
      clientAssignedMessageId: response.data.clientAssignedMessageId,
      emojiReactionSummaries: response.data.emojiReactionSummaries,
      
      deletionMetadata: response.data.deletionMetadata,
      quotedMessageMetadata: response.data.quotedMessageMetadata,
    };
  },
});