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
    'https://imagedelivery.net/bHREz764QO9n_1kIQUR2sw/c49d06c2-2602-43d5-3dff-de83b0c31300/public',
  authors: ['Swanblocks/Ahmad Shawar'],
  actions: [],
  triggers: [
    websocketSubscriptionTrigger,
  ],
});
