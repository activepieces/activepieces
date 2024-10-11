import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { returnFile } from './lib/actions/return-file';
import { returnMarkdown } from './lib/actions/return-markdown';
import { returnChatResponse } from './lib/chat/chat-response';
import { onChatSubmission } from './lib/chat/chat-trigger';
import { onFormSubmission } from './lib/triggers/form-trigger';

export const forms = createPiece({
  displayName: 'User Input',
  description: 'Trigger a flow through user input.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.3',
  categories: [PieceCategory.CORE],
  logoUrl: 'https://cdn.activepieces.com/pieces/forms.png',
  authors: ["MoShizzle", "abuaboud"],
  actions: [
    returnFile,
    returnMarkdown,
    returnChatResponse,
  ],
  triggers: [
    onFormSubmission,
    onChatSubmission,
  ],
});
