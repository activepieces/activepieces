import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { httpSendRequestAction } from './lib/actions/send-http-request-action';
import { httpReturnResponse } from './lib/actions/return-response';

export const http = createPiece({
  displayName: 'HTTP',
  description: 'Sends HTTP requests and return responses',
  logoUrl: 'https://cdn.activepieces.com/pieces/http.png',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.5.0',
  actions: [httpSendRequestAction, httpReturnResponse],
  authors: ['khaledmashaly', 'bibhuty-did-this', 'AbdulTheActivePiecer'],
  triggers: [],
});
