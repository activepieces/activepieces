import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { returnFile } from './lib/actions/return-file';
import { returnMarkdown } from './lib/actions/return-markdown';
import { onFormSubmission } from './lib/triggers/interface-trigger';

export const interfaces = createPiece({
  displayName: 'Interfaces',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.19.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/interfaces.png',
  authors: ['MoShizzle'],
  actions: [returnFile, returnMarkdown],
  triggers: [onFormSubmission],
});
