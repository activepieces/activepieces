import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createContact } from './lib/actions/create-contact';  // adjust the path if needed

export const prophone = createPiece({
  displayName: 'ProPhone',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://dallasreynoldstn.com/wp-content/uploads/2024/12/335075472_2181241605398309_5503235456039019472_n.jpg',
  authors: ['Dallas Reynolds Homes Inc'],
  categories: [PieceCategory.CORE],
  actions: [createContact],
  triggers: [],
});
