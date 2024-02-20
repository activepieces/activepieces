import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { returnFile } from './lib/actions/return-file';
import { returnMarkdown } from './lib/actions/return-markdown';
import { onFormSubmission } from './lib/triggers/form-trigger';
import { onFileSubmission } from './lib/triggers/file-trigger';

export const forms = createPiece({
  displayName: 'Forms',
  description: 'Trigger a flow through form interfaces.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.19.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/interfaces.png',
  authors: ['MoShizzle'],
  actions: [
    returnFile,
    returnMarkdown
  ],
  triggers: [
    onFormSubmission,
    onFileSubmission,
  ],
});
