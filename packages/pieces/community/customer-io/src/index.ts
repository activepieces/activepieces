import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { createEvent } from './lib/actions/create_event';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { customerIOCommon } from './lib/common';


const markdown = `
#### Obtain your Customer.io token
##### Track API Key
- https://www.customer.io/docs/api/track/#section/Authentication/Tracking-API-Key
- 'echo -n "SITE_ID:API_KEY" | base64'
##### bearer_token
- https://customer.io/docs/api/app/#section/Authentication
`;
export const customerIOAuth = PieceAuth.CustomAuth({
  props: {
    track_basic_token: Property.ShortText({
      displayName: 'Track API Key',
      required: true,
    }),
    api_bearer_token: Property.ShortText({
      displayName: 'Bearer Token',
      required: true,
    }),
  },
  description: markdown,
  required: true,
});

export const customerIo: any = createPiece({
  displayName: 'Customer-io',
  auth: customerIOAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/http.png',
  authors: [],
  actions: [
    createEvent,
    createCustomApiCallAction({
      baseUrl: () => customerIOCommon.trackUrl,
      auth: customerIOAuth,
      name: 'CIO_Track_API',
      description: 'CustomerIO Track Custom API Call (track.customer.io)',
      displayName: 'Track Custom API Call',
      authMapping: (auth) => ({
        Authorization: `Basic ${(auth as { track_basic_token: string }).track_basic_token}`,
      }),
    }),
    createCustomApiCallAction({
      baseUrl: () => customerIOCommon.apiUrl,
      auth: customerIOAuth,
      name: 'CIO_Base_API',
      description: 'CustomerIO Base Custom API Call (api.customer.io)',
      displayName: 'Base Custom API Call',
      authMapping: (auth) => ({
        Authorization: `Bearer ${(auth as { api_bearer_token: string }).api_bearer_token}`,
      }),
    })
  ],
  triggers: []
});
