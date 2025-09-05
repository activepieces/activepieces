import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { wonderchatAuth } from './lib/common/auth';
import { newUserMessage } from './lib/triggers/new-user-message';

export const wonderchat = createPiece({
  displayName: "WonderChat",
  description: "AI-powered chatbot platform for creating conversational experiences",
  auth: wonderchatAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/wonderchat.png",
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.COMMUNICATION],
  authors: [],
  actions: [],
  triggers: [newUserMessage],
});
