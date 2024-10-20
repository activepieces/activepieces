import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { returnFile } from './lib/actions/return-file';
import { returnMarkdown } from './lib/actions/return-markdown';
import { onChatSubmission } from './lib/triggers/chat-trigger';
import { onFormSubmission } from './lib/triggers/form-trigger';

export const forms = createPiece({
  displayName: 'Human Input',
  description: 'Trigger a flow through human input.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.34.3',
  categories: [PieceCategory.CORE],
  logoUrl: 'https://cdn.activepieces.com/pieces/human-input.svg',
  authors: ["anasbarg", "MoShizzle", "abuaboud"],
  actions: [
    returnFile,
    returnMarkdown,
  ],
  triggers: [
    onFormSubmission,
    onChatSubmission,
  ],
});
