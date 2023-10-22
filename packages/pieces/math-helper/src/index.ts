import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { addition } from './lib/actions/addition';
import { multiplication } from './lib/actions/multiplication';
import { subtraction } from './lib/actions/subtraction';
import { division } from './lib/actions/division';
import { modulo } from './lib/actions/modulo';
import { generateRandom } from './lib/actions/generateRandom';

const markdownDescription = `
Perform mathematical operations.
`;

export const math = createPiece({
  displayName: 'Math Helper',
  description: markdownDescription,
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/math-helper.svg',
  authors: ['lisander-lopez'],
  actions: [
    addition,
    subtraction,
    multiplication,
    division,
    modulo,
    generateRandom,
  ],
  triggers: [],
});
