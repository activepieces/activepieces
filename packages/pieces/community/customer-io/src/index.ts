import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { createEvent } from './lib/actions/create_event';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { customerIOCommon } from './lib/common';
import { Buffer } from 'buffer';


const markdown = `
#### Obtain your Customer.io token
##### Track Site ID and API Key
- https://www.customer.io/docs/api/track/#section/Authentication/Tracking-API-Key
##### bearer_token
- https://customer.io/docs/api/app/#section/Authentication
`;
export const customerIOAuth = PieceAuth.CustomAuth({
  props: {
    track_site_id: Property.ShortText({
      displayName: 'Site ID',
      required: true,
    }),
    track_api_key: Property.ShortText({
      displayName: 'API Key',
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
  logoUrl: 'cdn.activepieces.com/pieces/customerio.svg',
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
        Authorization: `Basic ${
          Buffer.from(
            `${(auth as { track_site_id: string }).track_site_id}:${(auth as { track_api_key: string }).track_api_key}`,
            'utf8'
          ).toString('base64')
        }`,
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
