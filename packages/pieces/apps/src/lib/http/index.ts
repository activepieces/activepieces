import {createPiece} from '@activepieces/framework';
import { httpSendRequestAction } from './actions/send-http-request-action';

export const http = createPiece({
	name: 'http',
	displayName: 'HTTP Request',
	logoUrl: 'https://cdn.activepieces.com/pieces/http.png',
	actions: [
    httpSendRequestAction,
  ],
	triggers: [
  ],
});
