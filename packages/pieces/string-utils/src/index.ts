import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { concat } from './lib/actions/concat';
import { replace } from './lib/actions/replace';
import { split } from './lib/actions/split';
import { substring } from './lib/actions/substring';

export const stringUtils = createPiece({
  displayName: 'String Utils',
  auth: PieceAuth.None(),
  logoUrl: 'https://cdn.activepieces.com/pieces/stability-ai.png',
  authors: ['abaza738'],
  actions: [concat, replace, split, substring],
  triggers: [],
});
