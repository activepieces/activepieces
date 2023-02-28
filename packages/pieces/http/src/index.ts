import {createPiece} from '@activepieces/framework';
import { httpSendRequestAction } from './lib/actions/send-http-request-action';

export const http = createPiece({
	name: 'http',
	displayName: 'HTTP Request',
	logoUrl: 'https://cdn.activepieces.com/pieces/http.png',
  version: '0.0.0',
	actions: [ httpSendRequestAction,],
	authors: ['khaledmashaly'],
	triggers: [
  ],
});
