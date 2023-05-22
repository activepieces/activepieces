import packageJson from '../package.json';
import { createPiece } from '@activepieces/pieces-framework';
import { httpSendRequestAction } from './lib/actions/send-http-request-action';

export const http = createPiece({
	name: 'http',
	displayName: 'HTTP Request',
	logoUrl: 'https://cdn.activepieces.com/pieces/http.png',
  version: packageJson.version,
	actions: [ httpSendRequestAction,],
	authors: ['khaledmashaly', 'bibhuty-did-this'],
	triggers: [
  ],
});
