import { PieceAuth, createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { httpSendRequestAction } from './lib/actions/send-http-request-action';
import { parseUrl } from './lib/actions/parse-url';

export const http = createPiece({
  displayName: 'HTTP',
  description: 'Sends HTTP requests and return responses',
  logoUrl: 'https://cdn.activepieces.com/pieces/new-core/http.svg',
  categories: [PieceCategory.CORE],
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.87.0',
  actions: [httpSendRequestAction, parseUrl],
  authors: [
    'bibhuty-did-this',
    'landonmoir',
    'JanHolger',
    'Salem-Alaa',
    'kishanprmr',
    'AbdulTheActivePiecer',
    'khaledmashaly',
    'abuaboud',
    'pfernandez98',
  ],
  triggers: [],
});
