import { createPiece } from '@activepieces/pieces-framework';
import { createEvent } from './lib/actions/create_event';
import { newReportingEvent } from './lib/trigger/new-reporting-event';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { customerIOCommon } from './lib/common';
import { Buffer } from 'buffer';
import { PieceCategory } from '@activepieces/pieces-framework';
import { customerIOAuth } from './lib/auth';

export const customerIo: any = createPiece({
  displayName: 'Customer.io',
  auth: customerIOAuth,
  description:
    'Create personalized journeys across all channels with our customer engagement platform.',
  categories: [PieceCategory.MARKETING],
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/customerio.png',
  authors: ['hamedsh', 'AbuAboud', 'AdamSelene'],
  actions: [
    createEvent,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        auth ? customerIOCommon[auth.props.region || 'us'].trackUrl : '',
      auth: customerIOAuth,
      name: 'custom_track_api_call',
      description: 'Call any Track API endpoint with your connection.',
      displayName: 'Track Custom API Call',
      props: {
        url: {
          description:
            "Full URL, or a path relative to your region's Track API URL.",
          placeholder: '/customers/42/events',
        },
      },
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(
          `${(auth).props.track_site_id}:${
            (auth).props.track_api_key
          }`,
          'utf8'
        ).toString('base64')}`,
      }),
    }),
    createCustomApiCallAction({
      baseUrl: (auth) =>
        auth ? customerIOCommon[auth.props.region || 'us'].apiUrl : '',
      auth: customerIOAuth,
      name: 'custom_app_api_call',
      description: 'Call any App API endpoint with your connection.',
      displayName: 'App Custom API Call',
      props: {
        url: {
          description:
            "Full URL, or a path relative to your region's App API URL.",
          placeholder: '/campaigns',
        },
      },
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth).props.api_bearer_token}`,
      }),
    }),
  ],
  triggers: [newReportingEvent],
});
