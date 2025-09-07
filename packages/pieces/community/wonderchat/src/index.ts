import { createPiece,PieceAuth } from '@activepieces/pieces-framework';
import { wonderchatAuth } from '../src/lib/auth';
import { askQuestion } from '../src/lib/actions/ask-question';
import { addPage } from '../src/lib/actions/add-page';
import { addTag } from '../src/lib/actions/add-tag';
import { removeTag } from '../src/lib/actions/remove-tag';
import { newUserMessage } from '../src/lib/triggers/new-user-message';

export const wonderchat = createPiece({
  displayName: 'Wonderchat',
  description: 'No-code chatbot platform: automate with messages, pages, and tags.',
  auth: wonderchatAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/wonderchat.png",
  authors: [],
  actions: [askQuestion, addPage, addTag, removeTag],
  triggers: [newUserMessage],
});
    