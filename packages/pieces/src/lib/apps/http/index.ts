import {createPiece} from '../../framework/piece';
import { httpSendRequestAction } from './actions/send-http-request-action';

export const http = createPiece({
	name: 'http',
	displayName: 'HTTP requests',
	logoUrl: 'https://cdn.activepieces.com/pieces/http.png',
	actions: [
    httpSendRequestAction,
  ],
	triggers: [
  ],
});
