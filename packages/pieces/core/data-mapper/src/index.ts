import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { advancedMapping } from './lib/actions/advanced-mapping';

export const dataMapper = createPiece({
  displayName: 'Data Mapper',
  description: 'Reshape data from earlier steps into a new object.',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/new-core/data-mapper.svg',
  auth: PieceAuth.None(),
  categories: [PieceCategory.CORE],
  authors: ["kishanprmr","MoShizzle","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  actions: [advancedMapping],
  triggers: [],
});
