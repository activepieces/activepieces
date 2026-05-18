import { createPiece } from '@activepieces/pieces-framework';
import { websocketCommon } from './lib/common/common';
import { websocketSubscriptionTrigger } from './lib/triggers/websocket-subscription-trigger';

export const anyHookWebsocket = createPiece({
  displayName: 'AnyHook Websocket',
  description:
    'AnyHook Websocket enables real-time communication through AnyHook proxy server by allowing you to subscribe and listen to websocket events',
  auth: websocketCommon.auth,
  minimumSupportedRelease: '0.20.0',
  logoUrl:
    'https://cdn.activepieces.com/pieces/anyhook-websocket.png',
  authors: ['Swanblocks/Ahmad Shawar'],
  actions: [],
  triggers: [
    websocketSubscriptionTrigger,
  ],
});
