import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { returnFile } from './lib/actions/return-file';
import { returnMarkdown } from './lib/actions/return-markdown';
import { onFormSubmission } from './lib/triggers/form-trigger';
import { onFileSubmission } from './lib/triggers/file-trigger';
import { PieceCategory } from '@activepieces/shared';

export const forms = createPiece({
  displayName: 'Forms (BETA)',
  description: 'Trigger a flow through form interfaces.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.3',
  categories: [PieceCategory.CORE],
  logoUrl: 'https://cdn.activepieces.com/pieces/forms.png',
  authors: ["MoShizzle","abuaboud"],
  actions: [
    returnFile,
    returnMarkdown
  ],
  triggers: [
    onFormSubmission,
    onFileSubmission,
  ],
});
