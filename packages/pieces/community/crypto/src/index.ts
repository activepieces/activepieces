import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { generatePassword } from './lib/actions/generate-password';
import { hashText } from './lib/actions/hash-text';

export const Crypto = createPiece({
  displayName: 'Crypto',
  description: 'Generate random passwords and hash existing text',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/crypto.png',
  categories: [PieceCategory.CORE],
  authors: ["AbdullahBitar","kishanprmr","abuaboud"],
  actions: [hashText, generatePassword],
  triggers: [],
});
