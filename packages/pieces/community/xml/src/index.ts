import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { convertJsonToXml } from './lib/actions/convert-json-to-xml';

export const xml = createPiece({
  displayName: 'XML',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/xml.png',
  auth: PieceAuth.None(),
  categories: [PieceCategory.OTHER],
  authors: ['Willianwg'],
  actions: [convertJsonToXml],
  triggers: [],
});
