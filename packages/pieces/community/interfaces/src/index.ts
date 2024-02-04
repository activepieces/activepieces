import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { interfaceTrigger } from './lib/triggers/interface-trigger';

export const interfaces = createPiece({
  displayName: 'Interfaces',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/interfaces.png',
  authors: ['MoShizzle'],
  actions: [],
  triggers: [interfaceTrigger],
});
