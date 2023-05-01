import packageJson from '../package.json';
import { createPiece, PieceType } from '@activepieces/pieces-framework';
import { httpSendRequestAction } from './lib/actions/send-http-request-action';

export const http = createPiece({
	name: 'http',
	displayName: 'HTTP Request',
	logoUrl: 'https://cdn.activepieces.com/pieces/http.png',
  version: packageJson.version,
	type: PieceType.PUBLIC,
	actions: [ httpSendRequestAction,],
	authors: ['khaledmashaly'],
	triggers: [
  ],
});
