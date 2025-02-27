import { createPiece } from '@activepieces/pieces-framework';
import { graphqlCommon } from './lib/common/common';
import { graphqlSubscriptionTrigger } from './lib/triggers/graphql-subscription-trigger';

export const anyHookGraphql = createPiece({
  displayName: 'AnyHook GraphQL',
  description:
    'AnyHook GraphQL enables real-time communication through AnyHook proxy server by allowing you to subscribe and listen to GraphQL subscription events',
  auth: graphqlCommon.auth,
  minimumSupportedRelease: '0.20.0',
  logoUrl:
    'https://imagedelivery.net/bHREz764QO9n_1kIQUR2sw/dcf09712-b3bf-46b2-88b2-afa00d42b600/public',
  authors: ['Swanblocks/Ahmad Shawar'],
  actions: [],
  triggers: [
    graphqlSubscriptionTrigger,
  ],
});
