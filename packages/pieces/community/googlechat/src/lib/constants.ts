import { PieceAuth } from "@activepieces/pieces-framework";
import { PubSub } from '@google-cloud/pubsub';

export const pubSubClient = new PubSub();

export const googleChatApiAuth = PieceAuth.OAuth2({
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: [
    'https://www.googleapis.com/auth/chat.messages',
    'https://www.googleapis.com/auth/chat.spaces',
    'https://www.googleapis.com/auth/chat.membership',
  ],
});
