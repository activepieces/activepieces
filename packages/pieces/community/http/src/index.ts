import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { httpReturnResponse } from './lib/actions/return-response';
import { httpSendRequestAction } from './lib/actions/send-http-request-action';

export const http = createPiece({
  displayName: 'HTTP',
  description: 'Sends HTTP requests and return responses',
  logoUrl: 'https://cdn.activepieces.com/pieces/http.png',
  categories: [PieceCategory.OTHER],
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.5.0',
  actions: [httpSendRequestAction, httpReturnResponse],
  authors: ['khaledmashaly', 'bibhuty-did-this', 'AbdulTheActivePiecer'],
  triggers: [],
});
