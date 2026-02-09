import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addition } from './lib/actions/addition';
import { division } from './lib/actions/division';
import { generateRandom } from './lib/actions/generateRandom';
import { modulo } from './lib/actions/modulo';
import { multiplication } from './lib/actions/multiplication';
import { subtraction } from './lib/actions/subtraction';

const markdownDescription = `
Perform mathematical operations.
`;

export const math = createPiece({
  displayName: 'Math Helper',
  description: markdownDescription,
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/math-helper.svg',
  categories: [PieceCategory.CORE],
  authors: ["kishanprmr","MoShizzle","abuaboud"],
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
