import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece,OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendMessage } from './lib/actions/send-message';
import { getDirectMessageDetails } from './lib/actions/get-direct-message-details';
import { addSpaceMember } from './lib/actions/add-space-member';
import { getMessage } from './lib/actions/get-message';
import { searchMessages } from './lib/actions/search-messages';
import { findMember } from './lib/actions/find-member';
import { newMessage } from './lib/trigger/new-message';
import { newMention } from './lib/trigger/new-mention';
import { googleChatCommon } from './lib/common';
import {GCHAT_API_URL} from './lib/common';

/**
 * Authentication configuration for Google Chat.
 * This uses OAuth2 for secure and authorized access to the Google Chat API.
 */
export const googleChatAuth = PieceAuth.OAuth2({
  description: 'Authentication for Google Chat',
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  pkce: true, 
  scope: [
    'https://www.googleapis.com/auth/chat.messages.create',
    'https://www.googleapis.com/auth/chat.spaces.readonly', // Scope for sending messages
    'https://www.googleapis.com/auth/chat.messages.readonly',
    'https://www.googleapis.com/auth/chat.messages',
    'https://www.googleapis.com/auth/chat.memberships',
    'https://www.googleapis.com/auth/chat.memberships',
    'https://www.googleapis.com/auth/chat.memberships.app',
    'https://www.googleapis.com/auth/chat.memberships.readonly',
    'https://www.googleapis.com/auth/chat.admin.memberships',

  ],
});

/**
 * Defines the Google Chat piece for Activepieces.
 * This piece will contain all the actions and triggers for interacting with Google Chat.
 */
export const googleChat = createPiece({
  displayName: 'Google-chat',
  auth: googleChatAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-chat.png',
  authors: ['pranith124'],
  actions: [
    sendMessage,
    getDirectMessageDetails,
    getMessage,
    addSpaceMember,
    searchMessages,
    findMember,
  ],
  triggers: [
    newMessage,
    newMention,
  ],
});