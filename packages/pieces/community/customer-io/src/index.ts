import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { createEvent } from './lib/actions/create_event';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { customerIOCommon } from './lib/common';
import { Buffer } from 'buffer';
import { PieceCategory } from '@activepieces/shared';

const markdown = `
**Site ID:**\n

Please log in and go to Settings, click [here](https://fly.customer.io/settings/api_credentials).

**Tracking API Key:**\n

Please log in and go to Settings, click [here](https://fly.customer.io/settings/api_credentials).

**APP API Token:**\n

Please log in and find it in Account Settings, click [here](https://fly.customer.io/settings/api_credentials?keyType=app).


<br>
Please note that the Track API Key and App API Key are different. You can read more about it [here](https://customer.io/docs/accounts-and-workspaces/managing-credentials/).
`;
export const customerIOAuth = PieceAuth.CustomAuth({
  props: {
    region: Property.StaticDropdown<'us' | 'eu'>({
      displayName: 'Region',
      required: true,
      defaultValue: 'us',
      options: {
        options: [
          { label: 'US', value: 'us' },
          { label: 'EU', value: 'eu' },
        ],
      },
    }),
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

type CustomerIOAuth = {
  region: 'eu' | 'us';
  track_site_id: string;
  track_api_key: string;
  api_bearer_token: string;
};
export const customerIo: any = createPiece({
  displayName: 'customer.io',
  auth: customerIOAuth,
  description:
    'Create personalized journeys across all channels with our customer engagement platform.',
  categories: [PieceCategory.MARKETING],
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/customerio.png',
  authors: ['hamedsh', 'AbuAboud', 'AdamSelene'],
  actions: [
    createEvent,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        customerIOCommon[(auth as CustomerIOAuth).region].trackUrl,
      auth: customerIOAuth,
      name: 'custom_track_api_call',
      description: 'CustomerIO Track Custom API Call (track.customer.io)',
      displayName: 'Track Custom API Call',
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(
          `${(auth as CustomerIOAuth).track_site_id}:${
            (auth as CustomerIOAuth).track_api_key
          }`,
          'utf8'
        ).toString('base64')}`,
      }),
    }),
    createCustomApiCallAction({
      baseUrl: (auth) =>
        customerIOCommon[(auth as CustomerIOAuth).region].apiUrl,
      auth: customerIOAuth,
      name: 'custom_app_api_call',
      description: 'CustomerIO App Custom API Call (api.customer.io)',
      displayName: 'App Custom API Call',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as CustomerIOAuth).api_bearer_token}`,
      }),
    }),
  ],
  triggers: [],
});
