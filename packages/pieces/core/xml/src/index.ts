import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { convertJsonToXml } from './lib/actions/convert-json-to-xml';

export const xml = createPiece({
  displayName: 'XML',
  description: 'Extensible Markup Language for storing and transporting data',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/xml.png',
  categories: [PieceCategory.CORE],
  auth: PieceAuth.None(),
  authors: ["Willianwg","kishanprmr","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  actions: [convertJsonToXml],
  triggers: [],
});
