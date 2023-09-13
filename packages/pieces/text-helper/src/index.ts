import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { concat } from './lib/actions/concat';
import { replace } from './lib/actions/replace';
import { split } from './lib/actions/split';
import { find } from './lib/actions/find';

export const textHelper = createPiece({
  displayName: 'Text Helper',
  auth: PieceAuth.None(),
  logoUrl: 'https://cdn.activepieces.com/pieces/text-helper.svg',
  authors: ['abaza738'],
  actions: [concat, replace, split, find],
  triggers: [],
});
