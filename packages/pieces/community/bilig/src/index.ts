import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { readRange } from './lib/actions/read-range';
import { setCellAndVerify } from './lib/actions/set-cell-and-verify';
import { validateFormula } from './lib/actions/validate-formula';

export const bilig = createPiece({
  displayName: 'Bilig WorkPaper',
  description: 'Read and verify spreadsheet-style WorkPaper JSON for agent workflows.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/bilig.png',
  authors: ['gregkonush'],
  categories: [PieceCategory.DEVELOPER_TOOLS],
  actions: [validateFormula, readRange, setCellAndVerify],
  triggers: [],
});
