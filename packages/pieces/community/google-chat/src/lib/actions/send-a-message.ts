import { createAction, Property } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { googleChatAuth } from '../common/auth';

export const sendAMessage = createAction({
  auth: googleChatAuth,
  name: 'sendAMessage',
  displayName: 'Send a Message',
  description: 'Send a message to a space or direct conversation in Google Chat',
  props: {
    space: Property.ShortText({
      displayName: 'Space Name',
      description: 'The space resource name (e.g., spaces/SPACE_ID) or user email for direct message',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Message Text',
      description: 'The text content of the message',
      required: false,
    }),
    messageType: Property.StaticDropdown({
      displayName: 'Message Type',
      description: 'Type of message to send',
      required: true,
      defaultValue: 'text',
      options: {
        options: [
          { label: 'Text Message', value: 'text' },
          { label: 'Card Message', value: 'card' },
        ],
      },
    }),
    cardJson: Property.Json({
      displayName: 'Card JSON',
      description: 'JSON structure for card message (only if Message Type is "Card Message")',
      required: false,
    }),
    threadKey: Property.ShortText({
      displayName: 'Thread Key',
      description: 'Optional thread key to reply to an existing thread',
      required: false,
    }),
  },
  async run(context) {
    const { space, text, messageType, cardJson, threadKey } = context.propsValue;
    
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const chat = google.chat({ version: 'v1', auth: authClient });

    // Construct the space name
    let spaceName = space;
    if (!space.startsWith('spaces/') && space.includes('@')) {
      // If it's an email, create a DM space
      spaceName = `spaces/${space}`;
    } else if (!space.startsWith('spaces/')) {
      spaceName = `spaces/${space}`;
    }

    // Construct message body based on type
    const messageBody: any = {};
    
    if (messageType === 'text' && text) {
      messageBody.text = text;
    } else if (messageType === 'card' && cardJson) {
      messageBody.cardsV2 = Array.isArray(cardJson) ? cardJson : [cardJson];
    }

    // Add thread information if provided
    if (threadKey) {
      messageBody.thread = { threadKey };
    }

    const response = await chat.spaces.messages.create({
      parent: spaceName,
      requestBody: messageBody,
    });

    return response.data;
  },
});