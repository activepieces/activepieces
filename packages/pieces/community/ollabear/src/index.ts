import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { ollabearAuth } from './lib/common';
import { sendMessage, setStatus, setTags, getConversation } from './lib/actions';
import {
  conversationCreated,
  conversationClosed,
  messageCreated,
} from './lib/triggers';

// Ollabear — automate the Ollabear AI chat platform. Triggers react to chat
// events and actions act on conversations, all through Ollabear's
// /v1/integrations PAT-scoped API. Authenticate with a Personal Access Token
// minted in the Ollabear dashboard (Settings → API Tokens → "Automation
// (Activepieces)" preset).
export const ollabear = createPiece({
  displayName: 'Ollabear',
  description:
    'Automate your Ollabear AI chat platform — trigger flows on new/closed conversations and messages, and send replies, set status, or tag conversations.',
  auth: ollabearAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://app.ollabear.com/favicon.svg',
  categories: [PieceCategory.CUSTOMER_SUPPORT, PieceCategory.COMMUNICATION],
  authors: ['vikasswaminh'],
  actions: [sendMessage, setStatus, setTags, getConversation],
  triggers: [conversationCreated, conversationClosed, messageCreated],
});
