import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { greenptAuth } from './lib/common/auth';
import { chatCompletion } from './lib/actions/chat-completion';
import { createEmbeddings } from './lib/actions/create-embeddings';
import { transcribeAudio } from './lib/actions/transcribe-audio';

export const greenpt = createPiece({
  displayName: 'Greenpt',
  auth: greenptAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/greenpt.png',
  authors: ['sanket-a11y'],
  actions: [chatCompletion, createEmbeddings, transcribeAudio],
  triggers: [],
});
