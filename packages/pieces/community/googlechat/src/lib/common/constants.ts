import { PieceAuth } from "@activepieces/pieces-framework";

export const googleChatApiAuth = PieceAuth.OAuth2({
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: [
    'https://www.googleapis.com/auth/chat.messages',
    'https://www.googleapis.com/auth/chat.spaces',
    'https://www.googleapis.com/auth/chat.memberships',
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/directory.readonly',
  ],
});

export const GOOGLE_SERVICE_ENTITIES = {
  chat: 'chat',
  cloudresourcemanager: 'cloudresourcemanager',
  pubsub: 'pubsub',
  workspaceevents: 'workspaceevents',
  people: 'people',
};