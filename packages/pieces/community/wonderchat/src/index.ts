import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { wonderchatAuth } from './lib/common/auth';
import { newUserMessage } from './lib/triggers/new-user-message';
import { addPage } from './lib/actions/add-page';
import { askQuestion } from './lib/actions/ask-question';
import { addTag } from './lib/actions/add-tag';
import { removeTag } from './lib/actions/remove-tag';

export const wonderchat = createPiece({
  displayName: "WonderChat",
  description: "AI-powered chatbot platform for creating conversational experiences",
  auth: wonderchatAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/wonderchat.png",
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.COMMUNICATION],
  authors: [],
  actions: [addPage, askQuestion, addTag, removeTag],
  triggers: [newUserMessage],
});
